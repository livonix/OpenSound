import { create } from 'zustand';
import { Track, PlaybackState } from '@shared/types';

interface PlayerStore extends PlaybackState {
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  volume: 1.0,
  currentTime: 0,
  duration: 0,
  buffered: 0,

  // Actions
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered }),
  reset: () => set({
    currentTrack: null,
    isPlaying: false,
    volume: 1.0,
    currentTime: 0,
    duration: 0,
    buffered: 0,
  }),
}));
