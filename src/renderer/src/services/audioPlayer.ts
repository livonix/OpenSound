import { Track } from '../../../shared/types';
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
      this.next();
    });

    this.audio.addEventListener('error', (e) => {
      const src = this.audio?.src || '';
      if (!src || src === 'about:blank') {
        return;
      }
      console.error('Audio playback error:', e);
      console.error('Audio src:', src);
      console.error('Audio error code:', this.audio?.error);
      usePlayerStore.getState().setPlaying(false);
    });
  }

  public async playTrack(track: Track): Promise<void> {
    try {
      console.log('=== playTrack called ===');
      console.log('Track:', track.name, 'by', track.artists[0]?.name);
      
      // Stop current playback
      this.stop();

      // Check if electronAPI is available
      console.log('Checking electronAPI...');
      const electronAPI = (window as any).electronAPI;
      
      if (!electronAPI) {
        console.error('Electron API not available');
        throw new Error('Electron API not available - make sure the app is running in Electron');
      }
      console.log('electronAPI found, checking methods...');

      // Check if getAudioUrl method exists
      if (typeof electronAPI.getAudioUrl !== 'function') {
        console.error('getAudioUrl method not found');
        throw new Error('getAudioUrl method not available in Electron API');
      }
      console.log('getAudioUrl method found, proceeding...');

      // Set current track
      this.currentTrack = track;
      usePlayerStore.getState().setCurrentTrack(track);

      // Get YouTube audio URL using Electron API (yt-dlp)
      const searchQuery = `${track.artists[0]?.name || ''} ${track.name}`;
      console.log('Searching YouTube for:', searchQuery);
      const tracks = await electronAPI.searchYouTube(searchQuery);
      
      console.log('YouTube tracks found:', tracks.length);
      console.log('YouTube tracks data:', tracks);
      
      let finalTracks = tracks;
      
      if (tracks.length === 0) {
        // Try a simpler search without artist name
        console.log('Trying simpler YouTube search...');
        const simpleQuery = track.name;
        const simpleTracks = await electronAPI.searchYouTube(simpleQuery);
        console.log('Simple YouTube search found:', simpleTracks.length);
        
        if (simpleTracks.length === 0) {
          throw new Error(`No tracks found for "${searchQuery}" or "${simpleQuery}"`);
        }
        
        finalTracks = simpleTracks;
      }

      // Get audio URL for the first track
      console.log('Getting YouTube audio URL for track:', finalTracks[0].id);
      const audioUrl = await electronAPI.getAudioUrl(finalTracks[0].id);
      
      console.log('Audio URL received:', audioUrl);
      console.log('Audio URL type:', typeof audioUrl);
      console.log('Audio URL length:', audioUrl?.length);
      
      if (!audioUrl || audioUrl === '' || audioUrl.startsWith('http://localhost')) {
        console.error('Invalid audio URL detected:', audioUrl);
        throw new Error('Invalid or empty audio URL received');
      }

      // Set audio source and play
      if (this.audio) {
        // IMPORTANT: Only set src when we have a valid URL
        this.audio.src = audioUrl;
        console.log('Audio src set to:', audioUrl);
        
        try {
          await this.audio.play();
          usePlayerStore.getState().setPlaying(true);
          console.log('Audio playing successfully');
        } catch (playError) {
          console.error('Failed to play audio:', playError);
          throw playError;
        }
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
      this.audio.removeAttribute('src');
      this.audio.load();
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
  
  public async next(): Promise<void> {
    const state = usePlayerStore.getState();
    const { queue, currentIndex } = state;
    const nextIndex = currentIndex + 1;
    if (queue && queue.length > 0 && nextIndex < queue.length) {
      const nextTrack = queue[nextIndex];
      state.setCurrentIndex(nextIndex);
      state.setCurrentTrack(nextTrack);
      await this.playTrack(nextTrack);
    } else {
      state.setPlaying(false);
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
