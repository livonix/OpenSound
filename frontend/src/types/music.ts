export interface Track {
  title: string;
  author: string;
  duration: number;
  identifier: string;
  isSeekable: boolean;
  isStream: boolean;
  sourceName: string;
  position: number;
  uri: string;
  artworkUrl?: string;
  isrc?: string;
  encoded: string;
}

export interface SearchResult {
  tracks: Track[];
  type: string;
  playlistInfo: any;
}

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  volume: number;
  position: number;
  track?: Track;
}
