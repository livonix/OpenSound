export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
  coverImage?: string;
  isPublic: boolean;
  image?: string; // For backward compatibility
}

export interface Track {
  id: string;
  title: string;
  author: string;
  duration: number;
  identifier: string;
  artworkUrl?: string;
  encoded: string;
}
