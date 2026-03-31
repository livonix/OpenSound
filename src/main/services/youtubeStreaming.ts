import { Track, Artist, Album, YouTubeVideo, StreamInfo, SearchResult } from '@shared/types';
import { exec } from 'yt-dlp-exec';

export class YouTubeStreamingService {
  private searchCache: Map<string, { tracks: Track[]; timestamp: number }> = new Map();
  private streamUrlCache: Map<string, { url: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SEARCH_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    console.log('YouTube streaming service created (yt-dlp only)');
  }

  /**
   * Search for tracks on YouTube using yt-dlp
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

    try {
      console.log(`🎬 Using yt-dlp search for: ${query}`);
      
      const result = await exec(`ytsearch15:${query}`, {
        flatPlaylist: true,
        dumpSingleJson: true,
        noWarnings: true,
        ignoreErrors: true,
        quiet: true
      });

      const data = JSON.parse(result.stdout);
      const entries = data.entries || [data];

      if (!Array.isArray(entries)) {
        console.log('⚠️ yt-dlp returned non-array format');
        return [];
      }

      console.log(`✅ yt-dlp found ${entries.length} results`);
      
      const tracks = entries.map((item: any) => this.convertYtdlpVideoToTrack(item))
        .filter(track => track.name && track.id);

      // Cache the results
      this.searchCache.set(cacheKey, { tracks, timestamp: Date.now() });
      
      return tracks;
    } catch (error: any) {
      console.error('❌ yt-dlp search failed:', error.message);
      return [];
    }
  }

  /**
   * Get direct streaming URL for a YouTube video using yt-dlp
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
      
      // Use yt-dlp directly for streaming URL
      return await this.getStreamUrlWithYtdlp(realVideoId);
    } catch (error: any) {
      console.error('yt-dlp failed for video:', realVideoId, error.message);
      throw new Error(`Failed to get stream URL for video ID: ${realVideoId}`);
    }
  }

  /**
   * Get streaming URL using yt-dlp
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
   * Get video info from YouTube video ID using yt-dlp
   */
  public async getVideoInfo(videoId: string): Promise<YouTubeVideo> {
    try {
      const result = await exec(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpSingleJson: true,
        noWarnings: true,
        quiet: true
      });

      const data = JSON.parse(result.stdout);
      
      return {
        id: data.id,
        title: data.title,
        channel: data.uploader || data.channel || 'Unknown',
        duration: this.formatDuration(data.duration || 0),
        url: data.webpage_url,
        thumbnail: data.thumbnail || ''
      };
    } catch (error: any) {
      console.error('Failed to get video info for:', videoId, error);
      throw new Error(`Failed to get video info for ID: ${videoId}`);
    }
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
