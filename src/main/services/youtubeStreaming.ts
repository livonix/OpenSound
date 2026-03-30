import axios from 'axios';
import { Track, Artist, Album, YouTubeVideo, StreamInfo, SearchResult } from '@shared/types';
import ytdl from 'ytdl-core';
import { exec } from 'yt-dlp-exec';

export class YouTubeStreamingService {
  private searchCache: Map<string, { tracks: Track[]; timestamp: number }> = new Map();
  private streamUrlCache: Map<string, { url: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SEARCH_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  
  // Updated list of Piped instances (March 2026)
  private readonly PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi-libre.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.syncpundit.io',
    'https://api-piped.mha.fi',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.nosebs.ru'
  ];

  // Invidious instances as backup
  private readonly INVIDIOUS_INSTANCES = [
    'https://yewtu.be',
    'https://invidious.snopyta.org',
    'https://vid.puffyan.us',
    'https://invidious.kavin.rocks',
    'https://invidious.nerdvpn.de',
    'https://yewtu.be',
    'https://ytnb.org'
  ];

  // Cache for working instances
  private workingInstances: Map<string, { lastSuccess: number; failures: number }> = new Map();
  private readonly INSTANCE_FAILURE_THRESHOLD = 3; // Mark as degraded after 3 failures
  private readonly INSTANCE_RECOVERY_TIME = 30 * 60 * 1000; // 30 minutes

  constructor() {
    console.log('YouTube streaming service created');
    this.initializeWorkingInstances();
  }

  /**
   * Initialize working instances cache
   */
  private initializeWorkingInstances(): void {
    this.PIPED_INSTANCES.forEach(instance => {
      this.workingInstances.set(instance, { lastSuccess: 0, failures: 0 });
    });
  }

  /**
   * Check if an instance is currently considered working
   */
  private isInstanceWorking(instance: string): boolean {
    const status = this.workingInstances.get(instance);
    if (!status) return true; // Unknown instance, try it
    
    const now = Date.now();
    
    // If instance has too many failures and hasn't recovered, skip it
    if (status.failures >= this.INSTANCE_FAILURE_THRESHOLD) {
      // Check if enough time has passed for recovery attempt
      return (now - status.lastSuccess) > this.INSTANCE_RECOVERY_TIME;
    }
    
    return true;
  }

  /**
   * Mark instance as successful
   */
  private markInstanceSuccess(instance: string): void {
    const status = this.workingInstances.get(instance) || { lastSuccess: 0, failures: 0 };
    status.lastSuccess = Date.now();
    status.failures = 0; // Reset failures on success
    this.workingInstances.set(instance, status);
  }

  /**
   * Mark instance as failed
   */
  private markInstanceFailure(instance: string): void {
    const status = this.workingInstances.get(instance) || { lastSuccess: 0, failures: 0 };
    status.failures++;
    this.workingInstances.set(instance, status);
  }

  /**
   * Get sorted list of instances (working ones first, then by recent success)
   */
  private getSortedInstances(): string[] {
    return [...this.PIPED_INSTANCES].sort((a, b) => {
      const aWorking = this.isInstanceWorking(a);
      const bWorking = this.isInstanceWorking(b);
      
      // Working instances first
      if (aWorking && !bWorking) return -1;
      if (!aWorking && bWorking) return 1;
      
      // Then by last success time (most recent first)
      const aStatus = this.workingInstances.get(a) || { lastSuccess: 0, failures: 0 };
      const bStatus = this.workingInstances.get(b) || { lastSuccess: 0, failures: 0 };
      
      return bStatus.lastSuccess - aStatus.lastSuccess;
    });
  }

  /**
   * Try multiple Piped instances with intelligent rotation
   */
  private async tryPipedInstances(endpoint: string): Promise<any> {
    const sortedInstances = this.getSortedInstances();
    
    for (const instance of sortedInstances) {
      try {
        const url = `${instance}${endpoint}`;
        console.log(`Trying Piped instance: ${instance}`);
        
        const response = await axios.get(url, { 
          timeout: 8000, // 8 seconds timeout
          validateStatus: (status) => status >= 200 && status < 300
        });
        
        // Validate response is JSON, not HTML
        if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
          console.log(`❌ Piped instance returned HTML (blocked/maintenance): ${instance}`);
          this.markInstanceFailure(instance);
          continue;
        }
        
        if (response.status === 200 && response.data) {
          console.log(`✅ Piped instance working: ${instance}`);
          this.markInstanceSuccess(instance);
          return response.data;
        }
      } catch (error: any) {
        const isRetryable = this.isRetryableError(error);
        console.log(`❌ Piped instance failed: ${instance} (${error.response?.status || error.code || error.message})`);
        
        if (isRetryable) {
          this.markInstanceFailure(instance);
        }
        continue;
      }
    }
    
    console.log('📊 Instance status:', this.getInstanceStats());
    throw new Error('All Piped instances are unavailable');
  }

  /**
   * Check if error is retryable (not a permanent failure)
   */
  private isRetryableError(error: any): boolean {
    const status = error.response?.status;
    // Don't mark instances as failed for 404 (not found) or auth errors
    // But mark for 502, 503, 504, timeout, DNS errors, etc.
    return !status || (status >= 500 && status < 600) || status === 429 || 
           error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';
  }

  /**
   * Get statistics about instances
   */
  private getInstanceStats(): { working: number; degraded: number; total: number } {
    let working = 0;
    let degraded = 0;
    
    this.PIPED_INSTANCES.forEach(instance => {
      if (this.isInstanceWorking(instance)) {
        working++;
      } else {
        degraded++;
      }
    });
    
    return { working, degraded, total: this.PIPED_INSTANCES.length };
  }

  /**
   * Search for tracks on YouTube using Piped API with multiple fallback layers
   */
  public async searchTracks(query: string): Promise<Track[]> {
    console.log('YouTube searching:', query);
    
    // Check cache first
    const cacheKey = `search:${query}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.SEARCH_CACHE_DURATION) {
      console.log('Using cached search results for:', query);
      return cached.tracks;
    }

    let tracks: Track[] = [];

    // Layer 1: Try Piped API instances
    try {
      const endpoint = `/api/v1/search?q=${encodeURIComponent(query)}&filter=music`;
      const response = await this.tryPipedInstances(endpoint);
      
      // Handle different response formats
      let videos: any[] = [];
      console.log('🔍 Piped response type:', typeof response);
      console.log('🔍 Piped response sample:', JSON.stringify(response, null, 2).substring(0, 500));
      
      if (Array.isArray(response)) {
        videos = response;
        console.log('✅ Response is direct array, length:', videos.length);
      } else if (response && response.items && Array.isArray(response.items)) {
        videos = response.items;
        console.log('✅ Response has items array, length:', videos.length);
      } else if (response && typeof response === 'object') {
        // Try to extract videos from different possible structures
        videos = response.videos || response.results || response.data || [];
        console.log('✅ Extracted videos from object, length:', videos.length, 'keys:', Object.keys(response));
      }
      
      if (!Array.isArray(videos)) {
        console.log('⚠️ Unexpected Piped response format:', typeof response, response);
        throw new Error('Invalid Piped response format');
      }
      
      tracks = videos.map((video: any) => this.convertPipedVideoToTrack(video));
      console.log(`🎵 Piped found ${tracks.length} tracks for:`, query);
    } catch (pipedError: any) {
      console.error('⚠️ All Piped instances failed, trying Invidious...', pipedError.message);
      
      // Layer 2: Try Invidious API
      try {
        const invidiousTracks = await this.tryInvidiousSearch(query);
        if (invidiousTracks.length > 0) {
          tracks = invidiousTracks;
          console.log(`🎵 Invidious found ${tracks.length} tracks for:`, query);
        }
      } catch (invidiousError: any) {
        console.error('⚠️ Invidious also failed, trying direct YouTube...', invidiousError.message);
        
        // Layer 3: Try direct YouTube search (limited fallback)
        try {
          const directTracks = await this.tryDirectYouTubeSearch(query);
          if (directTracks.length > 0) {
            tracks = directTracks;
            console.log(`🎵 Direct YouTube found ${tracks.length} tracks for:`, query);
          }
        } catch (directError: any) {
          console.error('⚠️ All search methods failed:', directError.message);
        }
      }
    }

    // Cache the results even if empty (to avoid repeated failures)
    this.searchCache.set(cacheKey, { tracks, timestamp: Date.now() });
    
    if (tracks.length === 0) {
      console.log('📊 No results found, search statistics:', this.getInstanceStats());
    }
    
    return tracks;
  }

  /**
   * Try Invidious instances for search
   */
  private async tryInvidiousSearch(query: string): Promise<Track[]> {
    for (const instance of this.INVIDIOUS_INSTANCES) {
      try {
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        console.log(`Trying Invidious instance: ${instance}`);
        
        const response = await axios.get(url, { 
          timeout: 6000,
          validateStatus: (status) => status >= 200 && status < 300
        });
        
        if (response.data && Array.isArray(response.data)) {
          const videos = response.data.slice(0, 15); // Limit results
          const tracks = videos.map((video: any) => this.convertInvidiousVideoToTrack(video));
          console.log(`✅ Invidious instance working: ${instance}`);
          return tracks;
        }
      } catch (error: any) {
        console.log(`❌ Invidious instance failed: ${instance} (${error.response?.status || error.code || error.message})`);
        continue;
      }
    }
    throw new Error('All Invidious instances failed');
  }

  /**
   * Try direct YouTube search as last resort using yt-dlp
   */
  private async tryDirectYouTubeSearch(query: string): Promise<Track[]> {
    try {
      console.log(`🎬 Using yt-dlp fallback for: ${query}`);
      
      const result = await exec(`ytsearch15:${query}`, {
        flatPlaylist: true,
        dumpSingleJson: true,
        noWarnings: true,
        ignoreErrors: true,
        quiet: true
      });

      const data = JSON.parse(result.stdout);
      const entries = data.entries || [data]; // parfois c'est un seul objet

      if (!Array.isArray(entries)) {
        console.log('⚠️ yt-dlp returned non-array format');
        return [];
      }

      console.log(`✅ yt-dlp found ${entries.length} results`);
      
      return entries.map((item: any) => this.convertYtdlpVideoToTrack(item))
        .filter(track => track.name && track.id);
    } catch (error: any) {
      console.error('❌ yt-dlp search failed:', error.message);
      return [];
    }
  }

  /**
   * Convert yt-dlp video response to Track format
   */
  private convertYtdlpVideoToTrack(item: any): Track {
    // Generate a unique ID based on YouTube video ID
    const id = `youtube_${item.id}`;
    
    // Create artist object from channel info
    const artist: Artist = {
      id: `channel_${item.channel_id || item.uploader_id}`,
      name: item.uploader || item.channel || 'Unknown',
      external_urls: {
        spotify: '' // Not applicable for YouTube
      }
    };

    // Create album object (using video as "album")
    const album: Album = {
      id: id,
      name: item.title || 'Unknown',
      artists: [artist],
      images: [{
        url: item.thumbnail || '',
        height: 360,
        width: 480
      }],
      release_date: item.upload_date ? new Date(item.upload_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      total_tracks: 1,
      external_urls: {
        spotify: '' // Not applicable for YouTube
      }
    };

    return {
      id,
      name: item.title || 'Unknown',
      artists: [artist],
      album,
      duration_ms: (item.duration || 0) * 1000,
      explicit: false, // yt-dlp doesn't provide this info
      external_urls: {
        spotify: '' // Not applicable for YouTube
      },
      uri: `youtube:${item.id}`
    };
  }

  /**
   * Get direct streaming URL for a YouTube video using ytdl-core with yt-dlp fallback
   */
  public async getStreamUrl(videoId: string): Promise<StreamInfo> {
    // Extract real YouTube video ID (remove youtube_ prefix)
    const realVideoId = videoId.replace('youtube_', '');
    
    // Check cache first
    const cached = this.streamUrlCache.get(realVideoId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('Using cached stream URL for video:', realVideoId);
      return {
        videoId: realVideoId,
        streamUrl: cached.url,
        format: 'audio/mp4',
        bitrate: 128
      };
    }

    try {
      console.log('Getting stream URL for video ID:', realVideoId);
      
      // Try ytdl-core first
      const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${realVideoId}`);
      
      // Find the best audio-only format
      const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
      
      if (!audioFormat || !audioFormat.url) {
        throw new Error('No audio format available for this video');
      }

      // Cache the URL
      this.streamUrlCache.set(realVideoId, { url: audioFormat.url, timestamp: Date.now() });
      
      console.log('Stream URL obtained for video:', realVideoId);
      
      return {
        videoId: realVideoId,
        streamUrl: audioFormat.url,
        format: audioFormat.container || 'mp4',
        bitrate: audioFormat.audioBitrate || 128
      };
    } catch (ytdlError: any) {
      console.log('ytdl-core failed, trying yt-dlp fallback for streaming:', ytdlError.message);
      
      // Fallback to yt-dlp for streaming URL
      try {
        return await this.getStreamUrlWithYtdlp(realVideoId);
      } catch (ytdlpError: any) {
        console.error('Both ytdl-core and yt-dlp failed for video:', realVideoId, ytdlpError.message);
        throw new Error(`Failed to get stream URL for video ID: ${realVideoId}`);
      }
    }
  }

  /**
   * Get streaming URL using yt-dlp as fallback
   */
  private async getStreamUrlWithYtdlp(videoId: string): Promise<StreamInfo> {
    try {
      console.log(`🎬 Using yt-dlp streaming fallback for: ${videoId}`);
      
      const result = await exec(`https://www.youtube.com/watch?v=${videoId}`, {
        format: 'bestaudio/best',
        getUrl: true,
        noWarnings: true,
        quiet: true
      });

      if (!result.stdout || result.stdout.trim() === '') {
        throw new Error('yt-dlp returned empty URL');
      }

      const streamUrl = result.stdout.trim();
      
      // Cache the URL
      this.streamUrlCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
      
      console.log('✅ yt-dlp streaming URL obtained for video:', videoId);
      
      return {
        videoId,
        streamUrl,
        format: 'audio/mp4',
        bitrate: 128
      };
    } catch (error: any) {
      console.error('❌ yt-dlp streaming failed:', error.message);
      throw error;
    }
  }

  /**
   * Get video info from YouTube video ID
   */
  public async getVideoInfo(videoId: string): Promise<YouTubeVideo> {
    try {
      const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
      
      return {
        id: info.videoDetails.videoId,
        title: info.videoDetails.title,
        channel: info.videoDetails.author.name,
        duration: this.formatDuration(parseInt(info.videoDetails.lengthSeconds)),
        url: info.videoDetails.video_url,
        thumbnail: info.videoDetails.thumbnails[0]?.url || ''
      };
    } catch (error: any) {
      console.error('Failed to get video info for:', videoId, error);
      throw new Error(`Failed to get video info for ID: ${videoId}`);
    }
  }

  /**
   * Convert Piped API video response to Track format
   */
  private convertPipedVideoToTrack(video: any): Track {
    // Generate a unique ID based on YouTube video ID
    const id = `youtube_${video.url.split('v=')[1]}`;
    
    // Create artist object from channel info
    const artist: Artist = {
      id: `channel_${video.uploaderUrl}`,
      name: video.uploaderName,
      external_urls: {
        spotify: '' // Not applicable for YouTube
      }
    };

    // Create album object (using video as "album")
    const album: Album = {
      id: id,
      name: video.title,
      artists: [artist],
      images: [{
        url: video.thumbnail,
        height: 360,
        width: 480
      }],
      release_date: new Date(video.uploadedDate).toISOString().split('T')[0],
      total_tracks: 1,
      external_urls: {
        spotify: '' // Not applicable for YouTube
      }
    };

    return {
      id,
      name: video.title,
      artists: [artist],
      album,
      duration_ms: video.duration * 1000,
      explicit: false, // Piped API doesn't provide this info
      external_urls: {
        spotify: '' // Not applicable for YouTube
      },
      uri: `youtube:${video.url.split('v=')[1]}`
    };
  }

  /**
   * Convert Invidious API video response to Track format
   */
  private convertInvidiousVideoToTrack(video: any): Track {
    // Generate a unique ID based on YouTube video ID
    const id = `youtube_${video.videoId}`;
    
    // Create artist object from channel info
    const artist: Artist = {
      id: `channel_${video.authorId}`,
      name: video.author,
      external_urls: {
        spotify: '' // Not applicable for YouTube
      }
    };

    // Create album object (using video as "album")
    const album: Album = {
      id: id,
      name: video.title,
      artists: [artist],
      images: [{
        url: video.videoThumbnails?.[0]?.url || '',
        height: video.videoThumbnails?.[0]?.height || 360,
        width: video.videoThumbnails?.[0]?.width || 480
      }],
      release_date: new Date(video.published * 1000).toISOString().split('T')[0],
      total_tracks: 1,
      external_urls: {
        spotify: '' // Not applicable for YouTube
      }
    };

    return {
      id,
      name: video.title,
      artists: [artist],
      album,
      duration_ms: video.lengthSeconds * 1000,
      explicit: false, // Invidious API doesn't provide this info
      external_urls: {
        spotify: '' // Not applicable for YouTube
      },
      uri: `youtube:${video.videoId}`
    };
  }

  /**
   * Format duration in seconds to MM:SS format
   */
  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Clean up caches
   */
  public clearCache(): void {
    this.searchCache.clear();
    this.streamUrlCache.clear();
    console.log('YouTube streaming service cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { searchCache: number; streamCache: number } {
    return {
      searchCache: this.searchCache.size,
      streamCache: this.streamUrlCache.size
    };
  }
}
