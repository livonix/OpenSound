import { Track } from '@shared/types';
import { usePlayerStore } from '../stores/playerStore';

export class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Create audio element
    this.audio = new Audio();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.audio) return;

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
        const buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
        usePlayerStore.getState().setBuffered(buffered);
      }
    });

    this.audio.addEventListener('ended', () => {
      usePlayerStore.getState().setPlaying(false);
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      usePlayerStore.getState().setPlaying(false);
    });
  }

  public async playTrack(track: Track): Promise<void> {
    try {
      // Stop current playback
      this.stop();

      // Set current track
      this.currentTrack = track;
      usePlayerStore.getState().setCurrentTrack(track);

      // Get YouTube audio URL using Electron API directly
      const electronAPI = (window as any).electronAPI;
      
      if (!electronAPI) {
        throw new Error('Electron API not available');
      }

      // Search for YouTube video
      const videos = await electronAPI.searchYouTube(`${track.artists[0]?.name || ''} - ${track.name} audio`);
      
      if (videos.length === 0) {
        throw new Error('No YouTube video found for this track');
      }

      // Get audio URL for the first video
      const audioUrl = await electronAPI.getAudioUrl(videos[0].id);
      
      if (!audioUrl) {
        throw new Error('Could not get audio URL for YouTube video');
      }

      // Set audio source and play
      if (this.audio) {
        this.audio.src = audioUrl;
        this.audio.load();
        
        await this.audio.play();
        usePlayerStore.getState().setPlaying(true);
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
    }
  }

  public resume(): void {
    if (this.audio && this.audio.paused) {
      this.audio.play();
      usePlayerStore.getState().setPlaying(true);
    }
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      usePlayerStore.getState().setPlaying(false);
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

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  public destroy(): void {
    this.stop();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.audio = null;
  }
}

// Singleton instance
export const audioPlayer = new AudioPlayerService();
