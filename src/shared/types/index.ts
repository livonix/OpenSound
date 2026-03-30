export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  duration_ms: number;
  explicit: boolean;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export interface Artist {
  id: string;
  name: string;
  images?: Image[];
  genres?: string[];
  popularity?: number;
  external_urls: {
    spotify: string;
  };
}

export interface Album {
  id: string;
  name: string;
  artists: Artist[];
  images: Image[];
  release_date: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface SearchResult {
  tracks: {
    items: Track[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  url: string;
  thumbnail: string;
}

export interface StreamInfo {
  videoId: string;
  streamUrl: string;
  format: string;
  bitrate: number;
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  buffered: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CacheEntry {
  key: string;
  data: any;
  expiresAt: number;
}

export interface AppConfig {
  spotify: {
    clientId: string;
    clientSecret: string;
  };
  youtube: {
    apiKey?: string;
    streamingEnabled: boolean;
  };
  cache: {
    maxSize: number;
    ttl: number;
  };
}
