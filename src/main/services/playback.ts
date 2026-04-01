import { EventEmitter } from 'events';
import { StreamService } from './streamer';
import { DiscordRPCService } from './discordRPC';
import { YouTubeLavalinkService } from './youtubeLavalinkService';
import { QueueRecommendationService } from './queueRecommendation';
import { Track, PlaybackState } from '../../shared/types';

export class PlaybackService extends EventEmitter {
  private streamService: StreamService;
  private discordRPC: DiscordRPCService;
  private youtubeService: YouTubeLavalinkService;
  private recommendationService: QueueRecommendationService;
  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private currentTime: number = 0;
  private duration: number = 0;
  private buffered: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private queue: Track[] = [];
  private nextTrack: Track | null = null;
  private preloadedStream: any = null;
  private preloadThreshold: number = 0.7; // Preload when 70% of current track is played

  constructor(streamService: StreamService, spotifyService?: any) {
    super();
    this.streamService = streamService;
    this.youtubeService = new YouTubeLavalinkService();
    this.discordRPC = new DiscordRPCService();
    this.recommendationService = spotifyService ? new QueueRecommendationService(spotifyService) : null!;
  }

  public async play(track: Track): Promise<{ streamUrl: string; track: Track }> {
    try {
      console.log('Playing track:', track.name);
      
      // Stop current playback if any
      if (this.currentTrack && this.currentTrack.id !== track.id) {
        await this.stop();
      }

      this.currentTrack = track;
      this.duration = track.duration_ms / 1000; // Convert to seconds
      this.currentTime = 0;

      // Update Discord RPC
      this.discordRPC.updateTrack(track);
      this.discordRPC.updatePlayingState(true);

      // Search directly via Lavalink YouTube
      let playbackTrack = track;
      console.log('Searching YouTube directly via Lavalink for:', track.name);
      
      // Search YouTube directly using the track name and artist
      const searchQuery = track.artists && track.artists.length > 0 
        ? `${track.artists[0].name} ${track.name}`
        : track.name;
        
      try {
        const youtubeTracks = await this.youtubeService.searchTracks(searchQuery);
        
        if (youtubeTracks.length === 0) {
          console.log('No YouTube results found, trying alternative search...');
          // Try with just the track name
          const altResults = await this.youtubeService.searchTracks(track.name);
          
          if (altResults.length === 0) {
            throw new Error(`No YouTube results found for: ${searchQuery}. Try a different track or check your Lavalink server configuration.`);
          }
          
          // Use alternative results
          playbackTrack = altResults[0];
          console.log(`Found YouTube track (alternative): ${playbackTrack.name}`);
        } else {
          // Use the first result
          playbackTrack = youtubeTracks[0];
          console.log(`Found YouTube track: ${playbackTrack.name}`);
        }
      } catch (searchError) {
        console.error('YouTube search failed:', searchError);
        throw new Error(`Failed to find YouTube version of track: ${track.name}. Make sure Lavalink is running on port 2333.`);
      }

      // Get streaming URL from YouTube Lavalink service
      const videoId = playbackTrack.uri.replace('youtube:', '');
      const streamInfo = await this.youtubeService.getStreamUrl(videoId);
      console.log('Streaming URL obtained from Lavalink:', streamInfo.streamUrl.substring(0, 50) + '...');
      
      // Emit playback state change
      this.isPlaying = true;
      this.emitStateChange();

      // Return the proxied streaming URL (port 3001 proxy adds Lavalink auth)
      const proxiedStreamUrl = streamInfo.streamUrl.replace('http://localhost:2333', 'http://localhost:3001/stream');
      console.log('Using proxied stream URL:', proxiedStreamUrl.substring(0, 50) + '...');
      
      return {
        streamUrl: proxiedStreamUrl,
        track: playbackTrack
      };

    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stopProgressTracking();
      this.discordRPC.updatePlayingState(false);
      this.emitStateChange();
    }
  }

  public resume(): void {
    if (!this.isPlaying && this.currentTrack) {
      this.isPlaying = true;
      this.startProgressTracking();
      this.discordRPC.updatePlayingState(true);
      this.emitStateChange();
    }
  }

  public async stop(): Promise<void> {
    if (this.currentTrack) {
      this.streamService.stopStream(this.currentTrack.id);
    }
    
    // Clear preloaded stream
    this.clearPreloadedStream();
    
    this.isPlaying = false;
    this.currentTime = 0;
    this.buffered = 0;
    this.stopProgressTracking();
    this.discordRPC.updatePlayingState(false);
    this.emitStateChange();
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.emitStateChange();
  }

  public seek(position: number): void {
    this.currentTime = Math.max(0, Math.min(position, this.duration));
    this.emitStateChange();
  }

  public getState(): PlaybackState {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTime: this.currentTime,
      duration: this.duration,
      buffered: this.buffered
    };
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public isTrackPlaying(): boolean {
    return this.isPlaying;
  }

  private emitStateChange(): void {
    this.emit('state-changed', this.getState());
  }

  private startProgressTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this.isPlaying) {
        this.currentTime += 0.1; // Update every 100ms
        this.emitStateChange();

        // Check if we should preload next track
        if (this.duration > 0) {
          const progress = this.currentTime / this.duration;
          if (progress >= this.preloadThreshold) {
            console.log(`Progress: ${(progress * 100).toFixed(1)}%, triggering preload (threshold: ${(this.preloadThreshold * 100).toFixed(1)}%)`);
            this.startPreloadingNext();
          }
        }

        // Check if track has ended
        if (this.currentTime >= this.duration) {
          this.onTrackEnd();
        }
      }
    }, 100);
  }

  private stopProgressTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private onTrackEnd(): void {
    console.log('Track ended, checking for next track...');
    console.log('Queue length:', this.queue.length);
    console.log('Has preloaded stream:', !!this.preloadedStream);
    console.log('Has next track:', !!this.nextTrack);
    
    this.isPlaying = false;
    this.stopProgressTracking();
    
    // Automatically play next track if available
    if (this.preloadedStream && this.nextTrack) {
      console.log('Track ended, playing preloaded next track');
      this.next().catch(error => {
        console.error('Error playing next track:', error);
        this.emitStateChange();
        this.emit('track-ended');
      });
    } else if (this.queue.length > 0) {
      console.log('Track ended, playing next track from queue');
      this.next().catch(error => {
        console.error('Error playing next track:', error);
        this.emitStateChange();
        this.emit('track-ended');
      });
    } else {
      console.log('Track ended, no next track available - stopping playback');
      this.currentTrack = null;
      this.emitStateChange();
      this.emit('track-ended');
    }
  }

  private handleError(error: any): void {
    console.error('Playback error:', error);
    this.isPlaying = false;
    this.stopProgressTracking();
    this.emit('error', error.message || 'Playback error occurred');
    this.emitStateChange();
  }

  public async next(): Promise<void> {
    console.log('Next() called - Queue length:', this.queue.length, 'Has preloaded:', !!this.preloadedStream);
    
    // Try to play preloaded track first
    if (this.preloadedStream && this.nextTrack) {
      const track = this.nextTrack;
      const stream = this.preloadedStream;
      this.clearPreloadedStream();
      
      // Remove the track from queue since we're playing it
      if (this.queue.length > 0 && this.queue[0].id === track.id) {
        this.queue.shift();
        this.emit('queue-updated', this.queue);
      }
      
      // Stop current track
      if (this.currentTrack) {
        this.streamService.stopStream(this.currentTrack.id);
      }
      
      // Set up preloaded track
      this.currentTrack = track;
      this.duration = track.duration_ms / 1000;
      this.currentTime = 0;
      this.isPlaying = true;
      
      // Update Discord RPC
      this.discordRPC.updateTrack(track);
      this.discordRPC.updatePlayingState(true);
      
      this.emitStateChange();
      this.startProgressTracking();
      
      // Handle preloaded stream events
      stream.on('data', (chunk: any) => {
        // Update buffer progress
        this.buffered = Math.min(this.buffered + chunk.length / 1000, this.duration);
        this.emit('buffer-update', this.buffered);
      });

      stream.on('end', () => {
        this.onTrackEnd();
      });

      stream.on('error', (error: any) => {
        this.handleError(error);
      });
      
      // Start preloading next track
      this.startPreloadingNext();
      
      this.emit('track-changed', track);
      console.log('Successfully switched to preloaded track:', track.name);
    } else if (this.queue.length > 0) {
      // Play next track from queue
      const nextTrack = this.queue.shift()!;
      console.log('Playing next track from queue:', nextTrack.name);
      await this.play(nextTrack);
      this.emit('track-changed', nextTrack);
    } else {
      // No next track available
      console.log('No next track available, stopping playback');
      await this.stop();
    }
  }

  public async previous(): Promise<void> {
    // For now, just restart current track or stop
    if (this.currentTrack) {
      if (this.currentTime > 3) {
        // Restart current track if more than 3 seconds have passed
        this.currentTime = 0;
        this.emitStateChange();
      } else {
        // Stop if less than 3 seconds (user wants previous track)
        await this.stop();
      }
    }
  }

  // Queue management methods
  public setQueue(tracks: Track[]): void {
    this.queue = tracks;
    this.emit('queue-updated', this.queue);
    
    // Start preloading if we have tracks and are currently playing
    if (this.queue.length > 0 && this.isPlaying && !this.preloadedStream) {
      console.log('Queue set with tracks, starting preload');
      this.startPreloadingNext();
    }
  }

  public addToQueue(track: Track): void {
    this.queue.push(track);
    this.emit('queue-updated', this.queue);
    this.emit('track-added-to-queue', track);
    
    // Start preloading if this is the first track and we're currently playing
    if (this.queue.length === 1 && this.isPlaying && !this.preloadedStream) {
      console.log('First track added to queue, starting preload');
      this.startPreloadingNext();
    }
  }

  public removeFromQueue(index: number): void {
    if (index >= 0 && index < this.queue.length) {
      const removedTrack = this.queue.splice(index, 1)[0];
      this.emit('queue-updated', this.queue);
      this.emit('track-removed-from-queue', removedTrack, index);
    }
  }

  public getQueue(): Track[] {
    return [...this.queue];
  }

  public clearQueue(): void {
    this.queue = [];
    this.clearPreloadedStream();
    this.emit('queue-updated', this.queue);
  }

// ... (rest of the code remains the same)
  // Smart queue methods
  public async generateSmartQueue(seedTrack: Track, queueSize: number = 20): Promise<Track[]> {
    if (!this.recommendationService) {
      console.warn('Recommendation service not available');
      return [];
    }

    try {
      const smartQueue = await this.recommendationService.generateSmartQueue(seedTrack, queueSize);
      console.log(`Generated smart queue with ${smartQueue.length} tracks for "${seedTrack.name}"`);
      return smartQueue;
    } catch (error) {
      console.error('Error generating smart queue:', error);
      return [];
    }
  }

  public async addToQueueSmart(additionalCount: number = 10): Promise<Track[]> {
    if (!this.recommendationService || this.queue.length === 0) {
      return this.queue;
    }

    try {
      const updatedQueue = await this.recommendationService.addToQueue(this.queue, additionalCount);
      this.queue = updatedQueue;
      this.emit('queue-updated', this.queue);
      console.log(`Added ${additionalCount} smart recommendations to queue`);
      return this.queue;
    } catch (error) {
      console.error('Error adding smart recommendations:', error);
      return this.queue;
    }
  }

  public getQueueStats(): any {
    if (!this.recommendationService) {
      return { totalTracks: this.queue.length, avgEnergy: 0, avgTempo: 0, genreDistribution: {} };
    }

    return this.recommendationService.getQueueStats(this.queue);
  }

  // Preloading methods
  private async startPreloadingNext(): Promise<void> {
    if (this.preloadedStream || this.queue.length === 0) {
      console.log(`Skipping preload - already preloaded: ${!!this.preloadedStream}, queue empty: ${this.queue.length === 0}`);
      return; // Already preloaded or no next track
    }

    try {
      this.nextTrack = this.queue[0];
      console.log(`Starting preload for next track: ${this.nextTrack.name} (Queue has ${this.queue.length} tracks)`);
      
      // Preload the stream using Lavalink
      const videoId = this.nextTrack.uri.replace('youtube:', '');
      const streamInfo = await this.youtubeService.getStreamUrl(videoId);
      this.preloadedStream = { streamUrl: streamInfo.streamUrl, videoId };
      
      // Preload successful - no error handler needed for object
      this.emit('next-track-preloaded', this.nextTrack);
      console.log(`Successfully preloaded next track: ${this.nextTrack.name}`);
    } catch (error) {
      console.error('Failed to preload next track:', error);
      this.clearPreloadedStream();
    }
  }

  private clearPreloadedStream(): void {
    if (this.preloadedStream && this.nextTrack) {
      console.log(`Clearing preloaded stream for: ${this.nextTrack.name}`);
      this.preloadedStream = null;
      this.nextTrack = null;
    }
  }

  public setPreloadThreshold(threshold: number): void {
    this.preloadThreshold = Math.max(0.1, Math.min(0.95, threshold));
  }

  public getPreloadThreshold(): number {
    return this.preloadThreshold;
  }

  public isNextTrackPreloaded(): boolean {
    return this.preloadedStream !== null;
  }

  public getNextTrack(): Track | null {
    return this.nextTrack || (this.queue.length > 0 ? this.queue[0] : null);
  }

  public setCrossfade(duration: number): void {
    // TODO: Implement crossfade functionality
    console.log(`Crossfade set to ${duration}ms`);
  }

  public enableGaplessPlayback(enabled: boolean): void {
    // TODO: Implement gapless playback
    console.log(`Gapless playback ${enabled ? 'enabled' : 'disabled'}`);
  }

  public getBufferedPercentage(): number {
    return this.duration > 0 ? (this.buffered / this.duration) * 100 : 0;
  }

  public getProgressPercentage(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }

  public destroy(): void {
    this.stop();
    this.clearQueue();
    this.discordRPC.disconnect();
    this.removeAllListeners();
  }

  public getDiscordRPC(): DiscordRPCService {
    return this.discordRPC;
  }
}
