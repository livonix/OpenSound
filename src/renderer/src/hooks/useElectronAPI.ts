import { useEffect, useState } from 'react';

export function useElectronAPI() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we're in an Electron environment
    console.log('Checking Electron API:', {
      hasWindow: typeof window !== 'undefined',
      hasElectronAPI: !!(window as any).electronAPI,
      userAgent: navigator.userAgent.includes('Electron')
    });
    
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      setIsReady(true);
    }
  }, []);

  return {
    isReady,
    api: (window as any).electronAPI,
  };
}

// Type-safe hook for specific API calls
export function useSpotifyAPI() {
  const { isReady, api } = useElectronAPI();

  if (!isReady || !api) {
    // Return a loading state instead of throwing an error
    return {
      searchTracks: () => Promise.resolve({ tracks: { items: [], total: 0, limit: 0, offset: 0 } }),
      getTrack: () => Promise.resolve(null),
      getAlbum: () => Promise.resolve(null),
      getArtist: () => Promise.resolve(null),
      isLoading: true
    };
  }

  return {
    searchTracks: async (query: string, limit: number, offset: number) => {
      console.log('useSpotifyAPI.searchTracks called:', { query, limit, offset });
      const result = await api.searchTracks(query, limit, offset);
      console.log('useSpotifyAPI.searchTracks result:', result);
      return result;
    },
    getTrack: api.getTrack,
    getAlbum: api.getAlbum,
    getArtist: api.getArtist,
    isLoading: false
  };
}

export function useYouTubeAPI() {
  const { isReady, api } = useElectronAPI();

  if (!isReady || !api) {
    return {
      search: () => Promise.resolve([]),
      getStreamInfo: () => Promise.resolve(null),
      getAudioUrl: () => Promise.resolve(''),
      isLoading: true
    };
  }

  return {
    search: api.searchYouTube,
    getStreamInfo: api.getStreamInfo,
    getAudioUrl: api.getAudioUrl,
    isLoading: false
  };
}

export function usePlaybackAPI() {
  const { isReady, api } = useElectronAPI();

  if (!isReady || !api) {
    return {
      playTrack: () => Promise.resolve(),
      pausePlayback: () => Promise.resolve(),
      resumePlayback: () => Promise.resolve(),
      setVolume: () => Promise.resolve(),
      seekTo: () => Promise.resolve(),
      onPlaybackStateChange: () => Promise.resolve(),
      onBufferUpdate: () => Promise.resolve(),
      onError: () => Promise.resolve(),
      isLoading: true
    };
  }

  return {
    playTrack: api.playTrack,
    pausePlayback: api.pausePlayback,
    resumePlayback: api.resumePlayback,
    setVolume: api.setVolume,
    seekTo: api.seekTo,
    onPlaybackStateChange: api.onPlaybackStateChange,
    onBufferUpdate: api.onBufferUpdate,
    onError: api.onError,
    isLoading: false
  };
}

export function usePlaylistAPI() {
  const { isReady, api } = useElectronAPI();

  if (!isReady || !api) {
    return {
      createPlaylist: () => Promise.resolve(null),
      addTrackToPlaylist: () => Promise.resolve(),
      removeTrackFromPlaylist: () => Promise.resolve(),
      getPlaylists: () => Promise.resolve([]),
      isLoading: true
    };
  }

  return {
    createPlaylist: api.createPlaylist,
    addTrackToPlaylist: api.addTrackToPlaylist,
    removeTrackFromPlaylist: api.removeTrackFromPlaylist,
    getPlaylists: async () => {
      console.log('🎵 usePlaylistAPI.getPlaylists() called');
      const result = await api.getPlaylists();
      console.log('🎵 usePlaylistAPI.getPlaylists() result:', result);
      return result;
    },
    isLoading: false
  };
}

export function useCacheAPI() {
  const { isReady, api } = useElectronAPI();

  if (!isReady || !api) {
    return {
      clearCache: () => Promise.resolve(),
      getCacheSize: () => Promise.resolve(0),
      isLoading: true
    };
  }

  return {
    clearCache: api.clearCache,
    getCacheSize: api.getCacheSize,
    isLoading: false
  };
}
