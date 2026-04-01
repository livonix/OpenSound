import { useEffect, useState, useCallback } from 'react';
import { useElectronAPI } from './useElectronAPI';
import { Track, LikedSongs } from '../../../shared/types';

export function useLikedSongs() {
  const { api, isReady } = useElectronAPI();
  const [likedSongs, setLikedSongs] = useState<LikedSongs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLikedSongs = useCallback(async () => {
    if (!isReady || !api) return;

    try {
      setIsLoading(true);
      const data = await api.getLikedSongs();
      setLikedSongs(data);
    } catch (error) {
      console.error('Failed to load liked songs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, api]);

  useEffect(() => {
    loadLikedSongs();
  }, [loadLikedSongs]);

  const isTrackLiked = useCallback(async (trackId: string): Promise<boolean> => {
    if (!isReady || !api) return false;

    try {
      return await api.isTrackLiked(trackId);
    } catch (error) {
      console.error('Failed to check if track is liked:', error);
      return false;
    }
  }, [isReady, api]);

  const toggleLikeTrack = useCallback(async (track: Track): Promise<boolean> => {
    if (!isReady || !api) return false;

    try {
      const result = await api.toggleLikeTrack(track);
      if (result.success) {
        // Update local state optimistically
        setLikedSongs(prev => {
          if (!prev) return prev;
          if (result.isLiked) {
            const likedTrack = { ...track, liked: true };
            return {
              ...prev,
              tracks: [...prev.tracks, likedTrack]
            };
          } else {
            return {
              ...prev,
              tracks: prev.tracks.filter(t => t.id !== track.id)
            };
          }
        });
        return result.isLiked;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle like track:', error);
      return false;
    }
  }, [isReady, api]);

  const likeTrack = useCallback(async (track: Track): Promise<boolean> => {
    if (!isReady || !api) return false;

    try {
      const result = await api.likeTrack(track);
      if (result.success) {
        // Update local state
        setLikedSongs(prev => {
          if (!prev) return prev;
          const likedTrack = { ...track, liked: true };
          return {
            ...prev,
            tracks: [...prev.tracks, likedTrack]
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to like track:', error);
      return false;
    }
  }, [isReady, api]);

  const unlikeTrack = useCallback(async (trackId: string): Promise<boolean> => {
    if (!isReady || !api) return false;

    try {
      const result = await api.unlikeTrack(trackId);
      if (result.success) {
        // Update local state
        setLikedSongs(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            tracks: prev.tracks.filter(t => t.id !== trackId)
          };
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unlike track:', error);
      return false;
    }
  }, [isReady, api]);

  const addLikedPropertyToTracks = useCallback(async (tracks: Track[]): Promise<Track[]> => {
    if (!isReady || !api) return tracks;

    try {
      return await api.addLikedPropertyToTracks(tracks);
    } catch (error) {
      console.error('Failed to add liked property to tracks:', error);
      return tracks;
    }
  }, [isReady, api]);

  return {
    likedSongs,
    isLoading,
    isTrackLiked,
    toggleLikeTrack,
    likeTrack,
    unlikeTrack,
    addLikedPropertyToTracks,
    refreshLikedSongs: loadLikedSongs
  };
}
