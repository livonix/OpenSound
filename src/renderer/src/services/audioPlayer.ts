import { Track } from '../../../shared/types';
import { usePlayerStore } from '../stores/playerStore';
import { localStorageService } from './localStorage';

export class AudioPlayerService {
  private static instance: AudioPlayerService;
  private isInitialized = false;
  private onEndedCallback?: () => void;
  private currentTrack: Track | null = null;
  private queue: Track[] = [];
  private isPreloadingNext = false;
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  private setupEventListeners(): void {
    if (this.isInitialized) return; // Prevent multiple initialization
    
    // Listen for backend playback events
    const electronAPI = (window as any).electronAPI;
    
    if (electronAPI) {
      // Queue events
      electronAPI.onPlaybackQueueUpdated?.((queue: Track[]) => {
        this.queue = queue;
        console.log('Queue updated from backend:', queue.length, 'tracks');
      });

      electronAPI.onPlaybackTrackAddedToQueue?.((track: Track) => {
        console.log('Track added to queue from backend:', track.name);
      });

      electronAPI.onPlaybackNextTrackPreloaded?.((track: Track) => {
        console.log('Next track preloaded from backend:', track.name);
        this.isPreloadingNext = true;
      });

      electronAPI.onPlaybackTrackChanged?.((track: Track) => {
        console.log('Track changed from backend:', track.name);
        this.currentTrack = track;
        usePlayerStore.getState().setCurrentTrack(track);
        usePlayerStore.getState().setPlaying(true);
      });

      electronAPI.onPlaybackTrackEnded?.(() => {
        console.log('Track ended from backend');
        usePlayerStore.getState().setPlaying(false);
      });
    }

    this.isInitialized = true;
  }

  public async playTrack(track: Track): Promise<void> {
    try {
      console.log('=== playTrack called (using backend) ===');
      console.log('Track:', track.name, 'by', track.artists[0]?.name);
      
      // Immediately stop current track if playing
      console.log('🔇 About to stop current track...');
      this.stopCurrent();
      
      // Also force stop via store to handle any playing audio
      const playerStore = usePlayerStore.getState();
      if (playerStore.isPlaying) {
        console.log('🔇 Forcing stop via player store');
        playerStore.setPlaying(false);
      }
      
      const electronAPI = (window as any).electronAPI;
      
      if (!electronAPI) {
        throw new Error('Electron API not available');
      }

      // Set current track in store
      this.currentTrack = track;
      usePlayerStore.getState().setCurrentTrack(track);

      // Save to recently played and update stats
      localStorageService.saveLastPlayedTrack(track);
      localStorageService.updateListeningStats(0); // Will be updated with actual play time

      // Update Discord RPC
      if (electronAPI.updateDiscordTrack) {
        try {
          await electronAPI.updateDiscordTrack(track);
          console.log('Discord RPC track updated');
        } catch (discordError) {
          console.error('Failed to update Discord RPC track:', discordError);
        }
      }

      // Use backend playback service to get streaming URL
      try {
        const result = await electronAPI.playbackPlay(track);
        console.log('Backend playback result:', result);
        
        if (result && result.streamUrl) {
          // Clean up previous audio element completely
          if (this.audio) {
            console.log('🔇 Stopping previous track');
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.src = '';
            // Clone the node to remove all event listeners
            this.audio.load();
            this.audio = null;
          }

          // Create new audio element
          console.log('🎵 Creating new audio element for:', track.name);
          this.audio = new Audio();
          this.audio.src = result.streamUrl;
          
          // Initialize volume from store
          const currentVolume = usePlayerStore.getState().volume;
          this.audio.volume = currentVolume;
          console.log('Audio volume initialized to:', currentVolume);
          
          // Only set crossOrigin for non-local URLs to avoid CORS issues
          if (!result.streamUrl.includes('localhost') && !result.streamUrl.includes('127.0.0.1')) {
            this.audio.crossOrigin = 'anonymous';
          }
          
          // Set up audio event listeners
          this.audio.addEventListener('timeupdate', () => {
            if (this.audio) {
              usePlayerStore.getState().setCurrentTime(this.audio.currentTime);
            }
          });

          this.audio.addEventListener('loadedmetadata', () => {
            if (this.audio) {
              usePlayerStore.getState().setDuration(this.audio.duration);
            }
          });

          this.audio.addEventListener('progress', () => {
            if (this.audio && this.audio.buffered.length > 0) {
              usePlayerStore.getState().setBuffered(this.audio.buffered.end(this.audio.buffered.length - 1));
            }
          });

          this.audio.addEventListener('ended', () => {
            console.log('Track ended, triggering next');
            this.next().catch(() => {
              usePlayerStore.getState().setPlaying(false);
            });
          });

          this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Audio src:', this.audio?.src);
            console.error('Audio error code:', this.audio?.error?.code);
            console.error('Audio error message:', this.audio?.error?.message);
            
          // Try to fallback to direct YouTube URL if proxy fails
          if (this.audio?.src.includes('localhost:3001')) {
            console.log('Proxy failed, trying direct URL fallback...');
            // This would require getting the direct URL from backend
            // For now, just stop playback
            usePlayerStore.getState().setPlaying(false);
          } else {
            usePlayerStore.getState().setPlaying(false);
          }
        });

          // Play the audio
          await this.audio.play();
          usePlayerStore.getState().setPlaying(true);
          
          // Update Discord RPC playing state
          if (electronAPI.updateDiscordPlayingState) {
            try {
              await electronAPI.updateDiscordPlayingState(true);
              console.log('Discord RPC playing state updated');
            } catch (discordError) {
              console.error('Failed to update Discord RPC playing state:', discordError);
            }
          }
          
          console.log('Track playing successfully via frontend with backend URL');
        } else {
          throw new Error('No streaming URL received from backend');
        }
      } catch (backendError) {
        console.error('Backend playback failed:', backendError);
        throw backendError;
      }
    } catch (error) {
      console.error('Error playing track:', error);
      usePlayerStore.getState().setPlaying(false);
      throw error;
    }
  }

  public pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      usePlayerStore.getState().setPlaying(false);
      
      // Update Discord RPC
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.updateDiscordPlayingState) {
        electronAPI.updateDiscordPlayingState(false).catch((error: any) => {
          console.error('Failed to update Discord RPC pause state:', error);
        });
      }
    }
  }

  public resume(): void {
    if (this.audio && this.audio.paused) {
      this.audio.play();
      usePlayerStore.getState().setPlaying(true);
      
      // Update Discord RPC
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.updateDiscordPlayingState) {
        electronAPI.updateDiscordPlayingState(true).catch((error: any) => {
          console.error('Failed to update Discord RPC resume state:', error);
        });
      }
      if (electronAPI && electronAPI.updateDiscordPlayingState) {
        electronAPI.updateDiscordPlayingState(false).catch((error: any) => {
          console.error('Failed to update Discord RPC stop state:', error);
        });
      }
    }
  }

  public setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
      usePlayerStore.getState().setVolume(volume);
    }
  }

  public seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
      usePlayerStore.getState().setCurrentTime(this.audio.currentTime);
    }
  }
  
  public async next(): Promise<void> {
    const state = usePlayerStore.getState();
    const { queue } = state;
    
    if (queue && queue.length > 0) {
      // Play next track from queue
      const nextTrack = queue[0];
      console.log('Playing next track from queue:', nextTrack.name);
      await this.playTrack(nextTrack);
      
      // Remove the played track from queue
      this.queue.shift();
      usePlayerStore.getState().setQueue(this.queue);
    } else {
      console.log('No next track available');
      usePlayerStore.getState().setPlaying(false);
    }
  }

  public async previous(): Promise<void> {
    // For now, just restart current track
    if (this.audio && this.currentTrack) {
      this.audio.currentTime = 0;
      console.log('Restarting current track');
    }
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public stop(): void {
    if (this.audio) {
      console.log('🛑 Stopping playback completely');
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      // Clone the node to remove all event listeners
      this.audio.load();
      this.audio = null;
      usePlayerStore.getState().setPlaying(false);
    }
  }

  public stopCurrent(): void {
    console.log('🔇 stopCurrent called, this.audio:', this.audio);
    if (this.audio) {
      console.log('🔇 Immediately stopping current track');
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.src = '';
        this.audio.load();
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
      this.audio = null;
      usePlayerStore.getState().setPlaying(false);
    } else {
      console.log('🔇 No audio to stop');
    }
  }

  public isPlaying(): boolean {
    return usePlayerStore.getState().isPlaying;
  }

  // Queue management methods
  public async setQueue(tracks: Track[]): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        await electronAPI.queueSet(tracks);
        console.log('Backend queue set with', tracks.length, 'tracks');
        this.queue = tracks;
        usePlayerStore.getState().setQueue(tracks);
      } catch (error: any) {
        console.error('Failed to set backend queue:', error);
      }
    }
  }

  public async addToQueue(track: Track): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        await electronAPI.queueAdd(track);
        console.log('Track added to backend queue:', track.name);
        this.queue.push(track);
        usePlayerStore.getState().setQueue(this.queue);
      } catch (error: any) {
        console.error('Failed to add track to backend queue:', error);
      }
    }
  }

  public async removeFromQueue(index: number): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        await electronAPI.queueRemove(index);
        console.log('Track removed from backend queue at index:', index);
        if (index >= 0 && index < this.queue.length) {
          this.queue.splice(index, 1);
          usePlayerStore.getState().setQueue(this.queue);
        }
      } catch (error: any) {
        console.error('Failed to remove track from backend queue:', error);
      }
    }
  }

  public async getQueue(): Promise<Track[]> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        const queue = await electronAPI.queueGet();
        this.queue = queue;
        return queue;
      } catch (error: any) {
        console.error('Failed to get backend queue:', error);
        return this.queue;
      }
    }
    return this.queue;
  }

  public async clearQueue(): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        await electronAPI.queueClear();
        console.log('Backend queue cleared');
        this.queue = [];
        usePlayerStore.getState().setQueue([]);
      } catch (error: any) {
        console.error('Failed to clear backend queue:', error);
      }
    }
  }

  // Preloading methods
  public async setPreloadThreshold(threshold: number): Promise<void> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        await electronAPI.playbackSetPreloadThreshold(threshold);
        console.log('Backend preload threshold set to:', threshold);
      } catch (error: any) {
        console.error('Failed to set backend preload threshold:', error);
      }
    }
  }

  public async getPreloadThreshold(): Promise<number> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        return await electronAPI.playbackGetPreloadThreshold();
      } catch (error: any) {
        console.error('Failed to get backend preload threshold:', error);
        return 0.7; // Default value
      }
    }
    return 0.7;
  }

  public async isNextTrackPreloaded(): Promise<boolean> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        return await electronAPI.playbackIsNextTrackPreloaded();
      } catch (error: any) {
        console.error('Failed to check if next track is preloaded:', error);
        return false;
      }
    }
    return false;
  }

  public async getNextTrack(): Promise<Track | null> {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        return await electronAPI.playbackGetNextTrack();
      } catch (error: any) {
        console.error('Failed to get next track from backend:', error);
        return null;
      }
    }
    return null;
  }

  public destroy(): void {
    this.stop();
    this.queue = [];
    this.currentTrack = null;
    this.isPreloadingNext = false;
    this.audio = null;
    console.log('AudioPlayerService destroyed');
  }
}

// Singleton instance
export const audioPlayer = AudioPlayerService.getInstance();
