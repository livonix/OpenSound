import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Play, Heart, Download, MoreHorizontal, ChevronLeft, Pause } from 'lucide-react';
import { usePlaylistAPI, useElectronAPI } from '../hooks/useElectronAPI';
import { useLikedSongs } from '../hooks/useLikedSongs';
import { useFollowedArtists } from '../hooks/useFollowedArtists';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';
import { HeartButtonWrapper } from '../components/HeartButtonWrapper';
import { ArtistModal } from '../components/ArtistModal';
import { Playlist, Track, Artist } from '../../../shared/types';

export function Library() {
  const [searchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'albums' | 'artists' | 'create' | 'playlist'>('playlists');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const { getPlaylists, createPlaylist } = usePlaylistAPI();
  const { api } = useElectronAPI();
  const { likedSongs: likedSongsData, isLoading: likedSongsLoading, refreshLikedSongs } = useLikedSongs();
  const { followedArtists, refreshFollowedArtists } = useFollowedArtists();
  const { currentTrack, isPlaying, setCurrentTrack, setPlaying } = usePlayerStore();

  // Function to refresh playlists data
  const refreshPlaylists = async () => {
    try {
      const userPlaylists = await getPlaylists();
      setPlaylists(userPlaylists);
      
      // Update selected playlist if it exists
      if (selectedPlaylist) {
        const updatedPlaylist = userPlaylists.find((p: Playlist) => p.id === selectedPlaylist.id);
        if (updatedPlaylist) {
          setSelectedPlaylist(updatedPlaylist);
        }
      }
    } catch (error) {
      console.error('Failed to refresh playlists:', error);
    }
  };

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
    } else if (activeTab === 'artists') {
      console.log('🔄 Switching to artists tab, refreshing data...');
      refreshFollowedArtists();
    }
  }, [activeTab, refreshLikedSongs, refreshFollowedArtists]);

  const loadLibraryContent = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading library content...');
      console.log('📡 API state:', { isReady: !!api, hasGetPlaylists: !!(api?.getPlaylists) });
      
      const userPlaylists = await getPlaylists();
      console.log('📝 Loaded playlists:', userPlaylists);
      console.log('📝 Playlists count:', userPlaylists?.length || 0);
      console.log('📝 Playlists type:', typeof userPlaylists);
      console.log('📝 Is array:', Array.isArray(userPlaylists));
      
      setPlaylists(userPlaylists || []);
      
      // If playlists are empty but we expect some, try to refresh after a delay
      if ((!userPlaylists || userPlaylists.length === 0) && api) {
        console.log('⚠️ No playlists loaded, will retry in 2 seconds...');
        setTimeout(() => {
          console.log('🔄 Retrying playlist load...');
          getPlaylists().then((retryPlaylists: Playlist[]) => {
            console.log('📝 Retry playlists:', retryPlaylists);
            if (retryPlaylists && retryPlaylists.length > 0) {
              setPlaylists(retryPlaylists);
            }
          }).catch((err: any) => {
            console.error('❌ Retry failed:', err);
          });
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Failed to load library:', error);
      setPlaylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh playlists when switching to playlist tab
  useEffect(() => {
    if (activeTab === 'playlist') {
      refreshPlaylists();
    }
  }, [activeTab]);

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

  // Debug logs for playlists
  useEffect(() => {
    console.log('📝 Library: playlists state updated:', playlists);
    console.log('📝 Library: playlists.length:', playlists.length);
    console.log('📝 Library: activeTab:', activeTab);
  }, [playlists, activeTab]);

  // Listen for playlist updates from other components
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      console.log('🔄 Playlist update detected, refreshing...');
      refreshPlaylists();
    };

    // Custom event listener for playlist updates
    window.addEventListener('playlist-updated', handlePlaylistUpdate);
    
    return () => {
      window.removeEventListener('playlist-updated', handlePlaylistUpdate);
    };
  }, [refreshPlaylists]);

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

  const handleArtistClick = async (artist: Artist, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      console.log('🎵 Artist clicked:', artist.name);
      
      // Get complete artist information from Spotify API
      const fullArtist = await api?.getArtist(artist.id);
      if (fullArtist) {
        console.log('📝 Full artist data:', fullArtist);
        setSelectedArtist(fullArtist);
      } else {
        // Fallback to basic artist info
        setSelectedArtist(artist);
      }
    } catch (error) {
      console.error('❌ Failed to handle artist click:', error);
      // Fallback to basic artist info
      setSelectedArtist(artist);
    }
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    try {
      console.log('🎵 Playing playlist:', playlist.name);
      
      if (playlist.tracks.length > 0) {
        const firstTrack = playlist.tracks[0];
        
        // If the same track is already playing, just toggle play/pause
        if (currentTrack?.id === firstTrack.id) {
          if (isPlaying) {
            audioPlayer.pause();
          } else {
            audioPlayer.resume();
          }
        } else {
          // Play the first track of the playlist
          await audioPlayer.playTrack(firstTrack);
        }
        
        console.log('✅ Playlist play command sent to audioPlayer');
      } else {
        console.log('📝 Playlist is empty, nothing to play');
      }
    } catch (error) {
      console.error('❌ Failed to play playlist:', error);
    }
  };

  // Helper function to determine if a track is currently playing
  const isCurrentlyPlaying = (track: Track) => {
    return currentTrack?.id === track.id && isPlaying;
  };

  // Helper function to get the correct icon for play/pause button
  const getPlayPauseIcon = (track: Track) => {
    return isCurrentlyPlaying(track) ? Pause : Play;
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
    { id: 'artists' as const, label: 'Artists', count: followedArtists.length },
  ];

  const PlaylistCard = ({ playlist }: { playlist: Playlist }) => {
    const firstTrack = playlist.tracks[0];
    const isPlayingFirstTrack = firstTrack ? isCurrentlyPlaying(firstTrack) : false;
    
    return (
      <div 
        className="card group cursor-pointer" 
        onClick={() => {
          setSelectedPlaylist(playlist);
          setActiveTab('playlist');
        }}
      >
        <div className="relative mb-4">
          <div className="w-full aspect-square bg-spotify-highlight rounded-lg flex items-center justify-center">
            <div className="text-spotify-gray group-hover:text-white">
              <Play size={48} />
            </div>
          </div>
          <button 
            className="absolute bottom-2 right-2 bg-spotify-green text-white rounded-full p-3 opacity-0 group-hover:opacity-100 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPlaylist(playlist);
            }}
          >
            {isPlayingFirstTrack ? (
              <Pause size={20} fill="white" />
            ) : (
              <Play size={20} fill="white" />
            )}
          </button>
        </div>
        <h3 className="font-semibold truncate mb-1 group-hover:text-white">{playlist.name}</h3>
        <p className="text-sm text-spotify-gray">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
        </p>
        {playlist.description && (
          <p className="text-xs text-spotify-gray mt-1 truncate">{playlist.description}</p>
        )}
      </div>
    );
  };

  const LikedSongsCard = () => {
    const firstLikedSong = likedSongs[0];
    const isPlayingFirstLiked = firstLikedSong ? isCurrentlyPlaying(firstLikedSong) : false;
    
    return (
      <div className="card group cursor-pointer" onClick={() => setActiveTab('liked')}>
        <div className="relative mb-4">
          <div className="w-full aspect-square bg-gradient-to-br from-spotify-green to-green-600 rounded-lg flex items-center justify-center">
            <Heart size={48} fill="white" className="text-white" />
          </div>
          <button 
            className="absolute bottom-2 right-2 bg-white text-spotify-green rounded-full p-3 opacity-0 group-hover:opacity-100 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              if (likedSongs.length > 0) {
                handlePlayTrack(likedSongs[0]);
              }
            }}
          >
            {isPlayingFirstLiked ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
        </div>
        <h3 className="font-semibold truncate mb-1">Liked Songs</h3>
        <p className="text-sm text-spotify-gray">
          {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
        </p>
      </div>
    );
  };

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
    <main className="pt-20 pb-32 px-4 h-screen overflow-y-auto scroll-smooth">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          {activeTab === 'playlist' && selectedPlaylist && (
            <button 
              onClick={() => setActiveTab('playlists')}
              className="btn-ghost p-2"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="text-3xl font-bold">
            {activeTab === 'playlist' && selectedPlaylist 
              ? selectedPlaylist.name 
              : 'Your Library'
            }
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'playlists' && (
            <button 
              onClick={() => setShowCreatePlaylist(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Create Playlist
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-spotify-highlight max-w-6xl mx-auto">
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
            {!isLoading && playlists.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                <LikedSongsCard />
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                {isLoading ? (
                  <div className="py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
                    <p className="text-spotify-gray">Loading playlists...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <div className="w-32 h-32 bg-spotify-highlight rounded-full flex items-center justify-center mx-auto mb-6 group hover:bg-spotify-green transition-colors cursor-pointer">
                        <Plus size={48} className="text-spotify-gray group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Create your first playlist</h3>
                    <p className="text-spotify-gray mb-8 max-w-md mx-auto">
                      It's easy, we'll help you build the perfect playlist with your favorite songs
                    </p>
                    <button 
                      onClick={() => setShowCreatePlaylist(true)}
                      className="btn-primary flex items-center gap-2 mx-auto text-lg px-8 py-3"
                    >
                      <Plus size={20} />
                      Create Playlist
                    </button>
                  </>
                )}
                
                {/* Debug info */}
                <div className="mt-4 text-xs text-spotify-gray">
                  Debug: playlists.length={playlists.length}, activeTab={activeTab}, isLoading={isLoading.toString()}
                </div>
                
                {/* Refresh button if playlists are empty but shouldn't be */}
                {!isLoading && playlists.length === 0 && (
                  <button 
                    onClick={loadLibraryContent}
                    className="mt-4 text-sm text-spotify-gray hover:text-white transition-colors underline"
                  >
                    Refresh playlists
                  </button>
                )}
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
                        {track.artists.map((artist, index) => (
                          <React.Fragment key={artist.id}>
                            <button
                              onClick={(e) => handleArtistClick(artist, e)}
                              className="text-spotify-gray hover:text-white transition-colors"
                              title={`View ${artist.name}`}
                            >
                              {artist.name}
                            </button>
                            {index < track.artists.length - 1 && ', '}
                          </React.Fragment>
                        ))}
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

        {activeTab === 'playlist' && selectedPlaylist && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-spotify-gray">
                {selectedPlaylist.tracks.length} {selectedPlaylist.tracks.length === 1 ? 'song' : 'songs'}
              </p>
              {selectedPlaylist.description && (
                <p className="text-sm text-spotify-gray mt-1">{selectedPlaylist.description}</p>
              )}
            </div>
            {selectedPlaylist.tracks.length > 0 ? (
              <div className="space-y-2">
                {selectedPlaylist.tracks.map((track) => (
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
                        {track.artists.map((artist, index) => (
                          <React.Fragment key={artist.id}>
                            <button
                              onClick={(e) => handleArtistClick(artist, e)}
                              className="text-spotify-gray hover:text-white transition-colors"
                              title={`View ${artist.name}`}
                            >
                              {artist.name}
                            </button>
                            {index < track.artists.length - 1 && ', '}
                          </React.Fragment>
                        ))}
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
                <Play size={48} className="text-spotify-gray mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No songs in this playlist</h3>
                <p className="text-spotify-gray mb-6">
                  Add some songs to this playlist to get started
                </p>
                <button 
                  onClick={() => setActiveTab('playlists')}
                  className="btn-primary"
                >
                  Browse Music
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'artists' && (
          <div>
            {followedArtists.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {followedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="card group cursor-pointer"
                    onClick={() => {
                      // Handle artist click - could open artist detail page
                      console.log('🎵 Artist clicked:', artist.name);
                    }}
                  >
                    <div className="relative mb-4">
                      {artist.images?.[0] ? (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-spotify-highlight rounded-lg flex items-center justify-center">
                          <div className="text-spotify-gray">
                            <Play size={48} />
                          </div>
                        </div>
                      )}
                      <button
                        className="absolute bottom-2 right-2 bg-spotify-green text-white rounded-full p-3 opacity-0 group-hover:opacity-100 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle play artist - would need artist top tracks
                          console.log('🎵 Play artist:', artist.name);
                        }}
                      >
                        <Play size={20} fill="white" />
                      </button>
                    </div>
                    <h3 className="font-semibold truncate mb-1 group-hover:text-white">{artist.name}</h3>
                    <p className="text-sm text-spotify-gray">
                      {artist.followers ? `${artist.followers.toLocaleString()} followers` : 'Artist'}
                    </p>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-xs text-spotify-gray mt-1 truncate">
                        {artist.genres.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-8">
                  <div className="w-32 h-32 bg-spotify-highlight rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play size={48} className="text-spotify-gray" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Follow your first artist</h3>
                <p className="text-spotify-gray mb-8 max-w-md mx-auto">
                  Follow artists to never miss new releases and see their latest music
                </p>
                <button 
                  onClick={() => window.location.href = '/search'}
                  className="btn-primary flex items-center gap-2 mx-auto text-lg px-8 py-3"
                >
                  <Plus size={20} />
                  Browse Artists
                </button>
              </div>
            )}
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

      {/* Artist Modal */}
      {selectedArtist && (
        <ArtistModal 
          artist={selectedArtist} 
          onClose={() => setSelectedArtist(null)} 
        />
      )}
    </main>
  );
};
