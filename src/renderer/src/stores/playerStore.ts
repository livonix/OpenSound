import { create } from 'zustand';
import { Track, PlaybackState } from '@shared/types';

interface PlayerStore extends PlaybackState {
  queue: Track[];
  currentIndex: number;
  setCurrentTrack: (track: Track | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  setCurrentIndex: (index: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1.0,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  queue: [],
  currentIndex: -1,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered }),
  setQueue: (tracks, startIndex = 0) => set({ queue: tracks, currentIndex: startIndex }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  reset: () => set({
    currentTrack: null,
    isPlaying: false,
    volume: 1.0,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    queue: [],
    currentIndex: -1,
  }),
}));
