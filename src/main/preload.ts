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

  // Playback controls
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

  // Utilities
  openExternal: (url: string) => Promise<void>;
  getVersion: () => Promise<string>;
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

  openExternal: (url: string) => 
    ipcRenderer.invoke('app:open-external', url),
  
  getVersion: () => 
    ipcRenderer.invoke('app:get-version')
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
