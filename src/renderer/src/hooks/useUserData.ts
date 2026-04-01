import { useEffect, useState, useCallback } from 'react';
import { useElectronAPI } from './useElectronAPI';
import { Track, Playlist } from '../../../shared/types';
import { localStorageService } from '../services/localStorage';

interface RecentlyPlayed {
  track: Track;
  playedAt: Date;
}

export function useUserData() {
  const { api, isReady } = useElectronAPI();
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load from local storage first
      const localRecentlyPlayed = localStorageService.getRecentlyPlayed();
      const localPlaylists = localStorageService.getPlaylists();
      
      // Convert local recently played format to hook format
      const formattedRecentlyPlayed = localRecentlyPlayed.map(item => ({
        track: item.track,
        playedAt: new Date(item.playedAt)
      }));
      
      // Convert local playlists format to hook format
      const formattedPlaylists = localPlaylists.map(playlist => ({
        ...playlist,
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt)
      }));
      
      setRecentlyPlayed(formattedRecentlyPlayed);
      setUserPlaylists(formattedPlaylists);
      setPlaylists(formattedPlaylists);

      // Try to sync with backend if available
      if (isReady && api) {
        try {
          const allPlaylistsData = await api.getPlaylists();
          if (allPlaylistsData && allPlaylistsData.length > 0) {
            // Merge backend playlists with local ones
            const mergedPlaylists = [...formattedPlaylists];
            allPlaylistsData.forEach((backendPlaylist: Playlist) => {
              if (!mergedPlaylists.find(p => p.id === backendPlaylist.id)) {
                mergedPlaylists.push(backendPlaylist);
              }
            });
            setUserPlaylists(mergedPlaylists);
            setPlaylists(mergedPlaylists);
            
            // Save merged playlists back to local storage
            const mergedForStorage = mergedPlaylists.map(playlist => ({
              ...playlist,
              createdAt: playlist.createdAt.toISOString(),
              updatedAt: playlist.updatedAt.toISOString()
            }));
            localStorageService.savePlaylists(mergedForStorage);
          }
        } catch (error) {
          console.warn('Failed to sync with backend, using local data:', error);
        }
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
      setRecentlyPlayed([]);
      setUserPlaylists([]);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, api]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const createPlaylist = useCallback(async (name: string, description?: string) => {
    if (!isReady || !api) return null;

    try {
      const newPlaylist = await api.createPlaylist(name, description);
      if (newPlaylist) {
        setUserPlaylists(prev => [...prev, newPlaylist]);
        setPlaylists(prev => [...prev, newPlaylist]);
      }
      return newPlaylist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      return null;
    }
  }, [isReady, api]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    if (!isReady || !api) return false;

    try {
      // Delete from local storage
      const currentPlaylists = localStorageService.getPlaylists();
      const updatedPlaylists = currentPlaylists.filter(p => p.id !== playlistId);
      localStorageService.savePlaylists(updatedPlaylists);
      
      // Update state
      const formattedUpdated = updatedPlaylists.map(playlist => ({
        ...playlist,
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt)
      }));
      setUserPlaylists(formattedUpdated);
      setPlaylists(formattedUpdated);
      
      console.log('Playlist deleted from local storage');
      return true;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return false;
    }
  }, [isReady, api]);

  const addToRecentlyPlayed = useCallback((track: Track) => {
    const current = localStorageService.getRecentlyPlayed();
    const newEntry = {
      track,
      playedAt: new Date().toISOString()
    };
    
    // Remove existing entries for the same track and add new one at the beginning
    const filtered = current.filter(item => item.track.id !== track.id);
    const updated = [newEntry, ...filtered].slice(0, 50); // Keep only last 50
    
    localStorageService.saveRecentlyPlayed(updated);
    
    // Update state
    const formatted = updated.map(item => ({
      track: item.track,
      playedAt: new Date(item.playedAt)
    }));
    setRecentlyPlayed(formatted);
  }, []);

  return {
    recentlyPlayed,
    playlists,
    userPlaylists,
    isLoading,
    refreshUserData: loadUserData,
    createPlaylist,
    deletePlaylist,
    addToRecentlyPlayed
  };
}
