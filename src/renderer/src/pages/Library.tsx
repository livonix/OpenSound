import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Play, Heart, Download, MoreHorizontal } from 'lucide-react';
import { usePlaylistAPI, useElectronAPI } from '../hooks/useElectronAPI';
import { useLikedSongs } from '../hooks/useLikedSongs';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';
import { HeartButtonWrapper } from '../components/HeartButtonWrapper';
import { Playlist, Track } from '../../../shared/types';

export function Library() {
  const [searchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'albums' | 'artists' | 'create'>('playlists');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { getPlaylists, createPlaylist } = usePlaylistAPI();
  const { api } = useElectronAPI();
  const { likedSongs: likedSongsData, isLoading: likedSongsLoading, refreshLikedSongs } = useLikedSongs();
  const { setCurrentTrack, setPlaying } = usePlayerStore();

  // Handle URL parameter for tab selection and refresh liked songs
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'liked') {
      setActiveTab('liked');
      // Refresh liked songs when switching to liked tab
      refreshLikedSongs();
    } else if (tabParam === 'create') {
      setActiveTab('create');
      setShowCreatePlaylist(true);
    }
  }, [searchParams, refreshLikedSongs]);

  // Handle tab changes and refresh liked songs when switching to liked tab
  useEffect(() => {
    if (activeTab === 'liked') {
      console.log('🔄 Switching to liked tab, refreshing data...');
      refreshLikedSongs();
    }
  }, [activeTab, refreshLikedSongs]);

  const loadLibraryContent = async () => {
    try {
      setIsLoading(true);
      const userPlaylists = await getPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryContent();
  }, []);

  useEffect(() => {
    if (likedSongsData) {
      console.log('📝 Library: likedSongsData updated:', likedSongsData);
      console.log('📝 Library: likedSongsData.tracks length:', likedSongsData.tracks.length);
      setLikedSongs(likedSongsData.tracks);
    }
  }, [likedSongsData]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const newPlaylist = await createPlaylist(newPlaylistName);
      setPlaylists([newPlaylist, ...playlists]);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
      setActiveTab('playlists');
      console.log('✅ Playlist created successfully:', newPlaylist.name);
    } catch (error) {
      console.error('❌ Failed to create playlist:', error);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    try {
      console.log('🎵 Playing track from library:', track.name);
      
      // Use the audioPlayer service directly
      await audioPlayer.playTrack(track);
      console.log('✅ Track play command sent to audioPlayer');
    } catch (error) {
      console.error('❌ Failed to play track:', error);
    }
  };

  const formatDuration = (duration_ms: number): string => {
    const minutes = Math.floor(duration_ms / 60000);
    const seconds = Math.floor((duration_ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'playlists' as const, label: 'Playlists', count: playlists.length },
    { id: 'liked' as const, label: 'Liked Songs', count: likedSongs.length },
    { id: 'albums' as const, label: 'Albums', count: 0 },
    { id: 'artists' as const, label: 'Artists', count: 0 },
  ];

  const PlaylistCard = ({ playlist }: { playlist: Playlist }) => (
    <div className="card group cursor-pointer">
      <div className="relative mb-4">
        <div className="w-full aspect-square bg-spotify-highlight rounded-lg flex items-center justify-center">
          <div className="text-spotify-gray">
            <Play size={48} />
          </div>
        </div>
        <button className="absolute bottom-2 right-2 bg-spotify-green text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 shadow-lg">
          <Play size={20} fill="white" />
        </button>
      </div>
      <h3 className="font-semibold truncate mb-1">{playlist.name}</h3>
      <p className="text-sm text-spotify-gray">
        {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
      </p>
      {playlist.description && (
        <p className="text-xs text-spotify-gray mt-1 truncate">{playlist.description}</p>
      )}
    </div>
  );

  const LikedSongsCard = () => (
    <div className="card group cursor-pointer" onClick={() => setActiveTab('liked')}>
      <div className="relative mb-4">
        <div className="w-full aspect-square bg-gradient-to-br from-spotify-green to-green-600 rounded-lg flex items-center justify-center">
          <Heart size={48} fill="white" className="text-white" />
        </div>
        <button className="absolute bottom-2 right-2 bg-spotify-green text-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 shadow-lg">
          <Play size={20} fill="white" />
        </button>
      </div>
      <h3 className="font-semibold truncate mb-1">Liked Songs</h3>
      <p className="text-sm text-spotify-gray">
        {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-spotify-highlight rounded-lg w-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="w-full aspect-square bg-spotify-highlight rounded-lg mb-4"></div>
                <div className="h-4 bg-spotify-highlight rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-spotify-highlight rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Library</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowCreatePlaylist(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Playlist
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-spotify-highlight">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-1 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-spotify-gray hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 text-sm text-spotify-gray">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'playlists' && (
          <div>
            {playlists.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                <LikedSongsCard />
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-spotify-gray mb-4">
                  <Plus size={48} className="mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create your first playlist</h3>
                <p className="text-spotify-gray mb-6">
                  It's easy, we'll help you build the perfect playlist
                </p>
                <button 
                  onClick={() => setShowCreatePlaylist(true)}
                  className="btn-primary"
                >
                  Create Playlist
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-spotify-gray">
                {likedSongsLoading ? 'Loading liked songs...' : `Showing ${likedSongs.length} liked song${likedSongs.length === 1 ? '' : 's'}`}
              </p>
            </div>
            {likedSongs.length > 0 ? (
              <div className="space-y-2">
                {likedSongs.map((track) => (
                  <div
                    key={track.id}
                    className="track-card group"
                    onClick={() => handlePlayTrack(track)}
                  >
                    {track.album?.images?.[0] && (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.name}</h4>
                      <p className="text-sm text-spotify-gray truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                    <div className="text-spotify-gray text-sm">
                      {track.album.name}
                    </div>
                    <div className="text-spotify-gray text-sm">
                      {formatDuration(track.duration_ms)}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <HeartButtonWrapper track={track} size={16} />
                      <button className="text-spotify-gray hover:text-white transition-colors">
                        <Download size={16} />
                      </button>
                      <button className="text-spotify-gray hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="text-spotify-gray mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No liked songs yet</h3>
                <p className="text-spotify-gray mb-6">
                  Songs you like will appear here
                </p>
                <p className="text-xs text-spotify-gray">
                  Debug: likedSongsLoading={likedSongsLoading.toString()}, likedSongs.length={likedSongs.length}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="text-center py-12">
            <MoreHorizontal size={48} className="text-spotify-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No artists yet</h3>
            <p className="text-spotify-gray mb-6">
              Artists you follow will appear here
            </p>
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-spotify-highlight rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create Playlist</h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="input-field w-full mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreatePlaylist(false);
                  setNewPlaylistName('');
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
