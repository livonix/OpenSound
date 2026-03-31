import { contextBridge, ipcRenderer } from 'electron';

// Define the API exposed to the renderer process
export interface ElectronAPI {
  // Spotify API
  searchTracks: (query: string, limit?: number) => Promise<any>;
  getTrack: (id: string) => Promise<any>;
  getAlbum: (id: string) => Promise<any>;
  getArtist: (id: string) => Promise<any>;

  // YouTube API
  searchYouTube: (query: string) => Promise<any>;
  getStreamInfo: (videoId: string) => Promise<any>;
  getAudioStream: (videoId: string) => Promise<ReadableStream>;
  getAudioUrl: (videoId: string) => Promise<string>;

  // Playback controls (new backend methods)
  playbackPlay: (track: any) => Promise<void>;
  playbackPause: () => Promise<void>;
  playbackResume: () => Promise<void>;
  playbackStop: () => Promise<void>;
  playbackSetVolume: (volume: number) => Promise<void>;
  playbackSeek: (position: number) => Promise<void>;
  playbackNext: () => Promise<void>;
  playbackPrevious: () => Promise<void>;

  // Queue management
  queueSet: (tracks: any[]) => Promise<void>;
  queueAdd: (track: any) => Promise<void>;
  queueRemove: (index: number) => Promise<void>;
  queueGet: () => Promise<any[]>;
  queueClear: () => Promise<void>;

  // Smart queue methods
  queueGenerateSmart: (seedTrack: any, queueSize?: number) => Promise<{ success: boolean; queue: any[] }>;
  queueAddSmart: (additionalCount?: number) => Promise<{ success: boolean; queue: any[] }>;
  queueGetStats: () => Promise<{ success: boolean; stats: any }>;

  // Preloading controls
  playbackSetPreloadThreshold: (threshold: number) => Promise<void>;
  playbackGetPreloadThreshold: () => Promise<number>;
  playbackIsNextTrackPreloaded: () => Promise<boolean>;
  playbackGetNextTrack: () => Promise<any>;

  // Legacy playback controls (for compatibility)
  playTrack: (track: any) => Promise<void>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  seekTo: (position: number) => Promise<void>;

  // Playlist management
  createPlaylist: (name: string, description?: string) => Promise<any>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylists: () => Promise<any[]>;

  // Cache management
  clearCache: () => Promise<void>;
  getCacheSize: () => Promise<number>;

  // Events
  onPlaybackStateChange: (callback: (state: any) => void) => void;
  onBufferUpdate: (callback: (buffered: number) => void) => void;
  onError: (callback: (error: string) => void) => void;
  onPlaybackQueueUpdated: (callback: (queue: any[]) => void) => void;
  onPlaybackTrackAddedToQueue: (callback: (track: any) => void) => void;
  onPlaybackTrackRemovedFromQueue: (callback: (track: any, index: number) => void) => void;
  onPlaybackNextTrackPreloaded: (callback: (track: any) => void) => void;
  onPlaybackTrackChanged: (callback: (track: any) => void) => void;
  onPlaybackTrackEnded: (callback: () => void) => void;

  // Utilities
  openExternal: (url: string) => Promise<void>;
  getVersion: () => Promise<string>;
  
  // Discord RPC
  testDiscordRPC: () => Promise<{ success: boolean; error?: string }>;
  updateDiscordTrack: (track: any) => Promise<{ success: boolean; error?: string }>;
  updateDiscordPlayingState: (isPlaying: boolean) => Promise<{ success: boolean; error?: string }>;

  // Liked Songs
  getLikedSongs: () => Promise<any>;
  isTrackLiked: (trackId: string) => Promise<boolean>;
  toggleLikeTrack: (track: any) => Promise<{ success: boolean; isLiked: boolean }>;
  likeTrack: (track: any) => Promise<{ success: boolean }>;
  unlikeTrack: (trackId: string) => Promise<{ success: boolean }>;
  addLikedPropertyToTracks: (tracks: any[]) => Promise<any[]>;

  // Followed Artists
  getFollowedArtists: () => Promise<any[]>;
  isFollowingArtist: (artistId: string) => Promise<boolean>;
  toggleFollowArtist: (artist: any) => Promise<{ success: boolean; isFollowing: boolean }>;
  followArtist: (artist: any) => Promise<{ success: boolean }>;
  unfollowArtist: (artistId: string) => Promise<{ success: boolean }>;
  getFollowedArtistsCount: () => Promise<number>;
  addFollowedPropertyToArtists: (artists: any[]) => Promise<any[]>;
}

// Expose the API to the renderer process
const electronAPI: ElectronAPI = {
  searchTracks: (query: string, limit?: number) => 
    ipcRenderer.invoke('spotify:search-tracks', query, limit),
  
  getTrack: (id: string) => 
    ipcRenderer.invoke('spotify:get-track', id),
  
  getAlbum: (id: string) => 
    ipcRenderer.invoke('spotify:get-album', id),
  
  getArtist: (id: string) => 
    ipcRenderer.invoke('spotify:get-artist', id),

  searchYouTube: (query: string) => 
    ipcRenderer.invoke('youtube:search', query),
  
  getStreamInfo: (videoId: string) => 
    ipcRenderer.invoke('youtube:get-stream-info', videoId),
  
  getAudioStream: (videoId: string) => 
    ipcRenderer.invoke('youtube:get-audio-stream', videoId),
  
  getAudioUrl: (videoId: string) => 
    ipcRenderer.invoke('youtube:get-stream-url', videoId),

  // New backend playback methods
  playbackPlay: (track: any) => 
    ipcRenderer.invoke('playback:play', track),
  
  playbackPause: () => 
    ipcRenderer.invoke('playback:pause'),
  
  playbackResume: () => 
    ipcRenderer.invoke('playback:resume'),
  
  playbackStop: () => 
    ipcRenderer.invoke('playback:stop'),
  
  playbackSetVolume: (volume: number) => 
    ipcRenderer.invoke('playback:set-volume', volume),
  
  playbackSeek: (position: number) => 
    ipcRenderer.invoke('playback:seek', position),
  
  playbackNext: () => 
    ipcRenderer.invoke('playback:next'),
  
  playbackPrevious: () => 
    ipcRenderer.invoke('playback:previous'),

  // Queue management
  queueSet: (tracks: any[]) => 
    ipcRenderer.invoke('queue:set', tracks),
  
  queueAdd: (track: any) => 
    ipcRenderer.invoke('queue:add', track),
  
  queueRemove: (index: number) => 
    ipcRenderer.invoke('queue:remove', index),
  
  queueGet: () => 
    ipcRenderer.invoke('queue:get'),
  
  queueClear: () => 
    ipcRenderer.invoke('queue:clear'),

  // Smart queue methods
  queueGenerateSmart: (seedTrack: any, queueSize?: number) => 
    ipcRenderer.invoke('queue:generate-smart', seedTrack, queueSize),

  queueAddSmart: (additionalCount?: number) => 
    ipcRenderer.invoke('queue:add-smart', additionalCount),

  queueGetStats: () => 
    ipcRenderer.invoke('queue:get-stats'),

  // Preloading controls
  playbackSetPreloadThreshold: (threshold: number) => 
    ipcRenderer.invoke('playback:set-preload-threshold', threshold),
  
  playbackGetPreloadThreshold: () => 
    ipcRenderer.invoke('playback:get-preload-threshold'),
  
  playbackIsNextTrackPreloaded: () => 
    ipcRenderer.invoke('playback:is-next-track-preloaded'),
  
  playbackGetNextTrack: () => 
    ipcRenderer.invoke('playback:get-next-track'),

  // Legacy playback controls (for compatibility)
  playTrack: (track: any) => 
    ipcRenderer.invoke('playback:play', track),
  
  pausePlayback: () => 
    ipcRenderer.invoke('playback:pause'),
  
  resumePlayback: () => 
    ipcRenderer.invoke('playback:resume'),
  
  setVolume: (volume: number) => 
    ipcRenderer.invoke('playback:set-volume', volume),
  
  seekTo: (position: number) => 
    ipcRenderer.invoke('playback:seek', position),

  createPlaylist: (name: string, description?: string) => 
    ipcRenderer.invoke('playlist:create', name, description),
  
  addTrackToPlaylist: (playlistId: string, trackId: string) => 
    ipcRenderer.invoke('playlist:add-track', playlistId, trackId),
  
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => 
    ipcRenderer.invoke('playlist:remove-track', playlistId, trackId),
  
  getPlaylists: () => 
    ipcRenderer.invoke('playlist:get-all'),

  clearCache: () => 
    ipcRenderer.invoke('cache:clear'),
  
  getCacheSize: () => 
    ipcRenderer.invoke('cache:get-size'),

  onPlaybackStateChange: (callback: (state: any) => void) => 
    ipcRenderer.on('playback:state-changed', (_, state) => callback(state)),
  
  onBufferUpdate: (callback: (buffered: number) => void) => 
    ipcRenderer.on('playback:buffer-update', (_, buffered) => callback(buffered)),
  
  onError: (callback: (error: string) => void) => 
    ipcRenderer.on('app:error', (_, error) => callback(error)),

  // New events for queue and preloading
  onPlaybackQueueUpdated: (callback: (queue: any[]) => void) => 
    ipcRenderer.on('playback:queue-updated', (_, queue) => callback(queue)),
  
  onPlaybackTrackAddedToQueue: (callback: (track: any) => void) => 
    ipcRenderer.on('playback:track-added-to-queue', (_, track) => callback(track)),
  
  onPlaybackTrackRemovedFromQueue: (callback: (track: any, index: number) => void) => 
    ipcRenderer.on('playback:track-removed-from-queue', (_, track, index) => callback(track, index)),
  
  onPlaybackNextTrackPreloaded: (callback: (track: any) => void) => 
    ipcRenderer.on('playback:next-track-preloaded', (_, track) => callback(track)),
  
  onPlaybackTrackChanged: (callback: (track: any) => void) => 
    ipcRenderer.on('playback:track-changed', (_, track) => callback(track)),
  
  onPlaybackTrackEnded: (callback: () => void) => 
    ipcRenderer.on('playback:track-ended', () => callback()),

  openExternal: (url: string) => 
    ipcRenderer.invoke('app:open-external', url),
  
  getVersion: () => 
    ipcRenderer.invoke('app:get-version'),

  testDiscordRPC: () => 
    ipcRenderer.invoke('discord:test'),

  updateDiscordTrack: (track: any) => 
    ipcRenderer.invoke('discord:update-track', track),

  updateDiscordPlayingState: (isPlaying: boolean) => 
    ipcRenderer.invoke('discord:update-playing-state', isPlaying),

  // Liked Songs
  getLikedSongs: () => 
    ipcRenderer.invoke('liked-songs:get'),

  isTrackLiked: (trackId: string) => 
    ipcRenderer.invoke('liked-songs:is-liked', trackId),

  toggleLikeTrack: (track: any) => 
    ipcRenderer.invoke('liked-songs:toggle', track),

  likeTrack: (track: any) => 
    ipcRenderer.invoke('liked-songs:like', track),

  unlikeTrack: (trackId: string) => 
    ipcRenderer.invoke('liked-songs:unlike', trackId),

  addLikedPropertyToTracks: (tracks: any[]) => 
    ipcRenderer.invoke('liked-songs:add-liked-property', tracks),

  // Followed Artists
  getFollowedArtists: () => 
    ipcRenderer.invoke('followed-artists:get'),

  isFollowingArtist: (artistId: string) => 
    ipcRenderer.invoke('followed-artists:is-following', artistId),

  toggleFollowArtist: (artist: any) => 
    ipcRenderer.invoke('followed-artists:toggle', artist),

  followArtist: (artist: any) => 
    ipcRenderer.invoke('followed-artists:follow', artist),

  unfollowArtist: (artistId: string) => 
    ipcRenderer.invoke('followed-artists:unfollow', artistId),

  getFollowedArtistsCount: () => 
    ipcRenderer.invoke('followed-artists:get-count'),

  addFollowedPropertyToArtists: (artists: any[]) => 
    ipcRenderer.invoke('followed-artists:add-followed-property', artists)
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded and electronAPI exposed to window');
console.log('Available methods:', Object.keys(electronAPI));

// Type declaration for the renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
