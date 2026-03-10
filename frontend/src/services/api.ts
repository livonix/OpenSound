import axios from 'axios';
import { SearchResult, Track } from '../types/music';
import { lavalinkAPI } from './lavalink-api';

// Déterminer si on est en mode Electron
const IS_ELECTRON = (window as any).config?.IS_ELECTRON || false;
const API_BASE_URL = IS_ELECTRON ? 'http://localhost:3001/api' : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchTracks = async (query: string, source = 'ytsearch'): Promise<SearchResult> => {
  if (IS_ELECTRON) {
    // Mode Electron : utiliser Lavalink directement
    try {
      const result = await lavalinkAPI.searchTracks(query, source);
      
      if (!result.data || result.data.length === 0) {
        return { tracks: [], type: 'empty', playlistInfo: null };
      }

      const tracks = result.data.map((track: any) => ({
        title: track.info?.title || 'Unknown Title',
        author: track.info?.author || 'Unknown Artist',
        duration: track.info?.length || 0,
        identifier: track.info?.identifier || '',
        isSeekable: track.info?.isSeekable || false,
        isStream: track.info?.isStream || false,
        sourceName: track.info?.sourceName || 'unknown',
        position: track.info?.position || 0,
        uri: track.info?.uri || '',
        artworkUrl: track.info?.artworkUrl || '',
        isrc: track.info?.isrc || '',
        encoded: track.encoded
      }));

      return {
        tracks,
        type: result.loadType || 'search',
        playlistInfo: result.playlistInfo || null
      };
    } catch (error) {
      console.error('Lavalink search error:', error);
      throw error;
    }
  } else {
    // Mode Web : utiliser le backend
    const response = await api.get('/search/tracks', {
      params: { query, source }
    });
    return response.data;
  }
};

export const getTrackDetails = async (identifier: string): Promise<Track> => {
  if (IS_ELECTRON) {
    const result = await lavalinkAPI.decodeTrack(identifier);
    return {
      title: result.info?.title || 'Unknown Title',
      author: result.info?.author || 'Unknown Artist',
      duration: result.info?.length || 0,
      identifier: result.info?.identifier || '',
      isSeekable: result.info?.isSeekable || false,
      isStream: result.info?.isStream || false,
      sourceName: result.info?.sourceName || 'unknown',
      position: result.info?.position || 0,
      uri: result.info?.uri || '',
      artworkUrl: result.info?.artworkUrl || '',
      isrc: result.info?.isrc || '',
      encoded: identifier
    };
  } else {
    const response = await api.get(`/search/track/${identifier}`);
    return response.data;
  }
};

export const playTrack = async (encodedTrack: string): Promise<any> => {
  if (IS_ELECTRON) {
    // Mode Electron : gestion locale du lecteur
    return { success: true, message: 'Track started' };
  } else {
    const response = await api.post('/player/play', {
      encodedTrack
    });
    return response.data;
  }
};

export const pauseTrack = async (guildId = 'web-player', paused = true): Promise<any> => {
  if (IS_ELECTRON) {
    return { success: true, message: paused ? 'Paused' : 'Resumed' };
  } else {
    const response = await api.post('/player/pause', {
      guildId,
      paused
    });
    return response.data;
  }
};

export const stopTrack = async (guildId = 'web-player'): Promise<any> => {
  if (IS_ELECTRON) {
    return { success: true, message: 'Stopped' };
  } else {
    const response = await api.post('/player/stop', {
      guildId
    });
    return response.data;
  }
};

export const setVolume = async (volume: number, guildId = 'web-player'): Promise<any> => {
  if (IS_ELECTRON) {
    return { success: true, message: `Volume set to ${volume}` };
  } else {
    const response = await api.post('/player/volume', {
      guildId,
      volume
    });
    return response.data;
  }
};

export const seekTrack = async (position: number, guildId = 'web-player'): Promise<any> => {
  if (IS_ELECTRON) {
    return { success: true, message: `Seeked to ${position}ms` };
  } else {
    const response = await api.post('/player/seek', {
      guildId,
      position
    });
    return response.data;
  }
};

export const getPlayerState = async (guildId = 'web-player'): Promise<any> => {
  if (IS_ELECTRON) {
    return {
      isPlaying: false,
      isPaused: false,
      volume: 100,
      position: 0
    };
  } else {
    const response = await api.get('/player/state', {
      params: { guildId }
    });
    return response.data;
  }
};

export const getAudioStream = async (encodedTrack: string): Promise<any> => {
  if (IS_ELECTRON) {
    // Mode Electron : utiliser Lavalink directement
    return await lavalinkAPI.getAudioStream(encodedTrack);
  } else {
    const response = await api.get(`/player/stream/${encodedTrack}`);
    return response.data;
  }
};

export const skipTrack = async (currentTrack: Track, skipPosition?: number, userId = 'default'): Promise<any> => {
  if (IS_ELECTRON) {
    // Mode Electron : utiliser le moteur de recommandation local
    return { success: false, message: 'Skip not implemented in Electron mode yet' };
  } else {
    const response = await api.post('/player/skip', {
      guildId: 'web-player',
      userId,
      currentTrack,
      skipPosition
    });
    return response.data;
  }
};

export const trackSearch = async (query: string, userId = 'default'): Promise<any> => {
  if (IS_ELECTRON) {
    return { success: true, message: 'Search tracked' };
  } else {
    const response = await api.post('/player/track-search', {
      userId,
      query
    });
    return response.data;
  }
};

export const getUserStats = async (userId = 'default'): Promise<any> => {
  const response = await api.get(`/player/stats/${userId}`);
  return response.data;
};
