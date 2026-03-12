import { EventEmitter } from 'events';
import { StreamService } from './streamer';
import { Track, PlaybackState } from '../../shared/types';

export class PlaybackService extends EventEmitter {
  private streamService: StreamService;
  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private currentTime: number = 0;
  private duration: number = 0;
  private buffered: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(streamService: StreamService) {
    super();
    this.streamService = streamService;
  }

  public async play(track: Track): Promise<void> {
    try {
      // Stop current playback if any
      if (this.currentTrack && this.currentTrack.id !== track.id) {
        await this.stop();
      }

      this.currentTrack = track;
      this.duration = track.duration_ms / 1000; // Convert to seconds
      this.currentTime = 0;

      // Start the stream - use fast streaming for better performance
      const stream = await this.streamService.getStreamWithFastBuffer(track);
      
      // Emit playback state change
      this.isPlaying = true;
      this.emitStateChange();

      // Start progress tracking
      this.startProgressTracking();

      // Handle stream events
      stream.on('data', (chunk) => {
        // Update buffer progress
        this.buffered = Math.min(this.buffered + chunk.length / 1000, this.duration);
        this.emit('buffer-update', this.buffered);
      });

      stream.on('end', () => {
        this.onTrackEnd();
      });

      stream.on('error', (error) => {
        this.handleError(error);
      });

    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stopProgressTracking();
      this.emitStateChange();
    }
  }

  public resume(): void {
    if (!this.isPlaying && this.currentTrack) {
      this.isPlaying = true;
      this.startProgressTracking();
      this.emitStateChange();
    }
  }

  public async stop(): Promise<void> {
    if (this.currentTrack) {
      this.streamService.stopStream(this.currentTrack.id);
    }
    
    this.isPlaying = false;
    this.currentTime = 0;
    this.buffered = 0;
    this.stopProgressTracking();
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
    this.isPlaying = false;
    this.stopProgressTracking();
    this.emitStateChange();
    this.emit('track-ended');
  }

  private handleError(error: any): void {
    console.error('Playback error:', error);
    this.isPlaying = false;
    this.stopProgressTracking();
    this.emit('error', error.message || 'Playback error occurred');
    this.emitStateChange();
  }

  public async next(): Promise<void> {
    // This would be implemented with a queue system
    // For now, just stop current playback
    await this.stop();
  }

  public async previous(): Promise<void> {
    // This would be implemented with a queue system
    // For now, just stop current playback
    await this.stop();
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
    this.removeAllListeners();
  }
}
