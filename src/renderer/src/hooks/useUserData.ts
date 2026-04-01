import { useEffect, useState, useCallback } from 'react';
import { useElectronAPI } from './useElectronAPI';
import { Track, Playlist } from '../../../shared/types';

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
    if (!isReady || !api) return;

    try {
      setIsLoading(true);
      
      // Load playlists using the existing handler
      const allPlaylistsData = await api.getPlaylists();
      setPlaylists(allPlaylistsData || []);
      setUserPlaylists(allPlaylistsData || []);

      // For recently played, we'll use a demo implementation for now
      // since there's no recently played handler in the IPC
      const demoRecentlyPlayed: RecentlyPlayed[] = [
        {
          track: {
            id: 'demo-1',
            name: 'Demo Track 1',
            artists: [{ id: 'artist-1', name: 'Demo Artist', external_urls: { spotify: '#' } }],
            album: {
              id: 'album-1',
              name: 'Demo Album',
              artists: [{ id: 'artist-1', name: 'Demo Artist', external_urls: { spotify: '#' } }],
              images: [{ url: 'https://via.placeholder.com/64', height: 64, width: 64 }],
              external_urls: { spotify: '#' },
              release_date: '2024-01-01',
              total_tracks: 10
            },
            duration_ms: 180000,
            explicit: false,
            external_urls: { spotify: '#' },
            uri: ''
          },
          playedAt: new Date(Date.now() - 3600000) // 1 hour ago
        }
      ];
      setRecentlyPlayed(demoRecentlyPlayed);

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
      // Note: There's no delete handler in IPC, this would need to be added
      console.log('Delete playlist not implemented in IPC yet');
      return false;
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      return false;
    }
  }, [isReady, api]);

  return {
    recentlyPlayed,
    playlists,
    userPlaylists,
    isLoading,
    refreshUserData: loadUserData,
    createPlaylist,
    deletePlaylist
  };
}
