import { useState, useEffect, useCallback } from 'react';
import { Artist } from '../../../shared/types';
import { useElectronAPI } from './useElectronAPI';

export function useFollowedArtists() {
  const { api } = useElectronAPI();
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFollowedArtists = useCallback(async () => {
    try {
      setIsLoading(true);
      const artists = await api?.getFollowedArtists();
      setFollowedArtists(artists || []);
      console.log('🎵 Refreshed followed artists:', artists?.length || 0);
    } catch (error) {
      console.error('Failed to refresh followed artists:', error);
      setFollowedArtists([]);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refreshFollowedArtists();
  }, [refreshFollowedArtists]);

  const isFollowingArtist = useCallback(async (artistId: string) => {
    try {
      return await api?.isFollowingArtist(artistId) || false;
    } catch (error) {
      console.error('Failed to check if artist is followed:', error);
      return false;
    }
  }, [api]);

  const followArtist = useCallback(async (artist: Artist) => {
    try {
      await api?.followArtist(artist);
      await refreshFollowedArtists();
      console.log('✅ Followed artist:', artist.name);
    } catch (error) {
      console.error('Failed to follow artist:', error);
      throw error;
    }
  }, [api, refreshFollowedArtists]);

  const unfollowArtist = useCallback(async (artistId: string) => {
    try {
      await api?.unfollowArtist(artistId);
      await refreshFollowedArtists();
      console.log('❌ Unfollowed artist:', artistId);
    } catch (error) {
      console.error('Failed to unfollow artist:', error);
      throw error;
    }
  }, [api, refreshFollowedArtists]);

  const toggleFollowArtist = useCallback(async (artist: Artist) => {
    try {
      const result = await api?.toggleFollowArtist(artist);
      await refreshFollowedArtists();
      console.log('🔄 Toggled follow for artist:', artist.name, 'isFollowing:', result?.isFollowing);
      return result?.isFollowing || false;
    } catch (error) {
      console.error('Failed to toggle follow artist:', error);
      throw error;
    }
  }, [api, refreshFollowedArtists]);

  const addFollowedPropertyToArtists = useCallback(async (artists: Artist[]) => {
    try {
      const artistsWithFollowed = await api?.addFollowedPropertyToArtists(artists);
      return artistsWithFollowed || artists;
    } catch (error) {
      console.error('Failed to add followed property to artists:', error);
      return artists;
    }
  }, [api]);

  return {
    followedArtists,
    isLoading,
    refreshFollowedArtists,
    isFollowingArtist,
    followArtist,
    unfollowArtist,
    toggleFollowArtist,
    addFollowedPropertyToArtists,
  };
}
