import axios from 'axios';
import { SearchResult, Track } from '../types/music';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchTracks = async (query: string, source = 'ytsearch'): Promise<SearchResult> => {
  const response = await api.get('/search/tracks', {
    params: { query, source }
  });
  return response.data;
};

export const getTrackDetails = async (identifier: string): Promise<Track> => {
  const response = await api.get(`/search/track/${identifier}`);
  return response.data;
};

export const playTrack = async (encodedTrack: string): Promise<any> => {
  const response = await api.post('/player/play', {
    encodedTrack
  });
  return response.data;
};

export const pauseTrack = async (guildId = 'web-player', paused = true): Promise<any> => {
  const response = await api.post('/player/pause', {
    guildId,
    paused
  });
  return response.data;
};

export const stopTrack = async (guildId = 'web-player'): Promise<any> => {
  const response = await api.post('/player/stop', {
    guildId
  });
  return response.data;
};

export const setVolume = async (volume: number, guildId = 'web-player'): Promise<any> => {
  const response = await api.post('/player/volume', {
    guildId,
    volume
  });
  return response.data;
};

export const seekTrack = async (position: number, guildId = 'web-player'): Promise<any> => {
  const response = await api.post('/player/seek', {
    guildId,
    position
  });
  return response.data;
};

export const getPlayerState = async (guildId = 'web-player'): Promise<any> => {
  const response = await api.get('/player/state', {
    params: { guildId }
  });
  return response.data;
};

export const getAudioStream = async (encodedTrack: string): Promise<any> => {
  const response = await api.get(`/player/stream/${encodedTrack}`);
  return response.data;
};

export const skipTrack = async (currentTrack: Track, skipPosition?: number, userId = 'default'): Promise<any> => {
  const response = await api.post('/player/skip', {
    guildId: 'web-player',
    userId,
    currentTrack,
    skipPosition
  });
  return response.data;
};

export const trackSearch = async (query: string, userId = 'default'): Promise<any> => {
  const response = await api.post('/player/track-search', {
    userId,
    query
  });
  return response.data;
};

export const getUserStats = async (userId = 'default'): Promise<any> => {
  const response = await api.get(`/player/stats/${userId}`);
  return response.data;
};
