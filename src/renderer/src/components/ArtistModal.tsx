import React, { useState, useEffect } from 'react';
import { X, Play, Heart, UserPlus, UserCheck, MoreHorizontal, Disc, Music } from 'lucide-react';
import { Artist, Album, Track } from '../../../shared/types';
import { FollowButton } from './FollowButton';
import { HeartButtonWrapper } from './HeartButtonWrapper';
import { useElectronAPI } from '../hooks/useElectronAPI';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';

interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
}

export function ArtistModal({ artist, onClose }: ArtistModalProps) {
  const { api } = useElectronAPI();
  const { setCurrentTrack } = usePlayerStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  useEffect(() => {
    if (artist) {
      loadArtistAlbums();
      loadPopularTracks();
    }
  }, [artist]);

  const loadArtistAlbums = async () => {
    if (!artist || !api) return;
    
    setIsLoadingAlbums(true);
    try {
      console.log('🔄 Loading albums for artist:', artist.name);
      // Simulated albums data
      const simulatedAlbums: Album[] = [
        {
          id: 'album1',
          name: 'Les yeux plus gros que le monde',
          artists: [artist],
          images: artist.images || [],
          release_date: '2016',
          total_tracks: 20,
          external_urls: { spotify: artist.external_urls?.spotify || '' }
        },
        {
          id: 'album2', 
          name: 'Mon cœur avait raison',
          artists: [artist],
          images: artist.images || [],
          release_date: '2013',
          total_tracks: 18,
          external_urls: { spotify: artist.external_urls?.spotify || '' }
        }
      ];
      
      setAlbums(simulatedAlbums);
      console.log('📝 Loaded albums:', simulatedAlbums.length);
    } catch (error) {
      console.error('❌ Failed to load albums:', error);
      setAlbums([]);
    } finally {
      setIsLoadingAlbums(false);
    }
  };

  const loadPopularTracks = async () => {
    if (!artist || !api) return;
    
    setIsLoadingTracks(true);
    try {
      console.log('🔄 Loading popular tracks for artist:', artist.name);
      // Simulated popular tracks data
      const simulatedTracks: Track[] = [
        {
          id: 'track1',
          name: 'J\'me tire',
          artists: [artist],
          album: {
            id: 'album1',
            name: 'Les yeux plus gros que le monde',
            artists: [artist],
            images: artist.images || [],
            release_date: '2016',
            total_tracks: 20,
            external_urls: { spotify: artist.external_urls?.spotify || '' }
          },
          duration_ms: 240000, // 4 minutes
          explicit: false,
          preview_url: '',
          external_urls: { spotify: artist.external_urls?.spotify || '' },
          uri: 'spotify:track:1'
        },
        {
          id: 'track2',
          name: 'Est-ce que tu m\'aimes?',
          artists: [artist],
          album: {
            id: 'album2',
            name: 'Mon cœur avait raison',
            artists: [artist],
            images: artist.images || [],
            release_date: '2013',
            total_tracks: 18,
            external_urls: { spotify: artist.external_urls?.spotify || '' }
          },
          duration_ms: 210000, // 3:30
          explicit: false,
          preview_url: '',
          external_urls: { spotify: artist.external_urls?.spotify || '' },
          uri: 'spotify:track:2'
        },
        {
          id: 'track3',
          name: 'Sapés comme jamais',
          artists: [artist],
          album: {
            id: 'album1',
            name: 'Les yeux plus gros que le monde',
            artists: [artist],
            images: artist.images || [],
            release_date: '2016',
            total_tracks: 20,
            external_urls: { spotify: artist.external_urls?.spotify || '' }
          },
          duration_ms: 195000, // 3:15
          explicit: false,
          preview_url: '',
          external_urls: { spotify: artist.external_urls?.spotify || '' },
          uri: 'spotify:track:3'
        },
        {
          id: 'track4',
          name: 'Maman ne va pas',
          artists: [artist],
          album: {
            id: 'album1',
            name: 'Les yeux plus gros que le monde',
            artists: [artist],
            images: artist.images || [],
            release_date: '2016',
            total_tracks: 20,
            external_urls: { spotify: artist.external_urls?.spotify || '' }
          },
          duration_ms: 225000, // 3:45
          explicit: false,
          preview_url: '',
          external_urls: { spotify: artist.external_urls?.spotify || '' },
          uri: 'spotify:track:4'
        },
        {
          id: 'track5',
          name: 'Marabout',
          artists: [artist],
          album: {
            id: 'album2',
            name: 'Mon cœur avait raison',
            artists: [artist],
            images: artist.images || [],
            release_date: '2013',
            total_tracks: 18,
            external_urls: { spotify: artist.external_urls?.spotify || '' }
          },
          duration_ms: 200000, // 3:20
          explicit: false,
          preview_url: '',
          external_urls: { spotify: artist.external_urls?.spotify || '' },
          uri: 'spotify:track:5'
        }
      ];
      
      setPopularTracks(simulatedTracks);
      console.log('📝 Loaded popular tracks:', simulatedTracks.length);
    } catch (error) {
      console.error('❌ Failed to load popular tracks:', error);
      setPopularTracks([]);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    try {
      console.log('🎵 Playing track from artist modal:', track.name);
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

  if (!artist) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-spotify-highlight rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          {/* Background image or gradient */}
          {artist.images?.[0] ? (
            <div 
              className="h-64 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${artist.images[0].url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-spotify-highlight to-transparent"></div>
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-spotify-green to-green-600 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-spotify-highlight to-transparent opacity-50"></div>
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>
          
          {/* Artist info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-end gap-6">
              {artist.images?.[0] ? (
                <img
                  src={artist.images[0].url}
                  alt={artist.name}
                  className="w-32 h-32 rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 bg-spotify-dark rounded-lg shadow-2xl flex items-center justify-center">
                  <UserPlus size={48} className="text-spotify-gray" />
                </div>
              )}
              
              <div className="flex-1 pb-4">
                <h1 className="text-4xl font-bold text-white mb-2">{artist.name}</h1>
                <div className="flex items-center gap-4 text-white/80">
                  {artist.followers && (
                    <span>{artist.followers.toLocaleString()} followers</span>
                  )}
                  {artist.popularity && (
                    <span>• Popularity: {artist.popularity}</span>
                  )}
                </div>
                {artist.genres && artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {artist.genres.slice(0, 5).map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white/20 rounded-full text-sm text-white"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 border-b border-spotify-gray">
          <div className="flex items-center gap-4">
            <button className="btn-primary flex items-center gap-2 px-8 py-3">
              <Play size={20} fill="white" />
              Play
            </button>
            
            <FollowButton artist={artist} size={20} />
            
            <button className="text-spotify-gray hover:text-white transition-colors">
              <Heart size={24} />
            </button>
            
            <button className="text-spotify-gray hover:text-white transition-colors">
              <MoreHorizontal size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 400px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Popular tracks */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Popular</h2>
              {isLoadingTracks ? (
                <div className="text-spotify-gray text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading popular tracks...</p>
                </div>
              ) : popularTracks.length > 0 ? (
                <div className="space-y-2">
                  {popularTracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-spotify-dark transition-colors cursor-pointer group"
                      onClick={() => handlePlayTrack(track)}
                    >
                      <div className="text-spotify-gray w-6 text-center group-hover:text-white">
                        {index + 1}
                      </div>
                      
                      {track.album?.images?.[0] ? (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-12 h-12 rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-spotify-dark rounded flex items-center justify-center">
                          <Music size={20} className="text-spotify-gray" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate group-hover:text-white">{track.name}</h4>
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
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-spotify-gray text-center py-12">
                  <Music size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No popular tracks found</p>
                  <p className="text-sm mt-2">Popular tracks will appear here when available</p>
                </div>
              )}
            </div>

            {/* Albums */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Albums</h2>
              {isLoadingAlbums ? (
                <div className="text-spotify-gray text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Loading albums...</p>
                </div>
              ) : albums.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {albums.map((album) => (
                    <div key={album.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-spotify-dark transition-colors cursor-pointer">
                      {album.images?.[0] ? (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          className="w-16 h-16 rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-spotify-dark rounded flex items-center justify-center">
                          <Disc size={24} className="text-spotify-gray" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{album.name}</h4>
                        <p className="text-sm text-spotify-gray">
                          {album.release_date} • {album.total_tracks} tracks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-spotify-gray text-center py-12">
                  <div className="w-16 h-16 bg-spotify-dark rounded-lg mx-auto mb-4 opacity-50"></div>
                  <p>No albums found</p>
                  <p className="text-sm mt-2">Albums will appear here when available</p>
                </div>
              )}
            </div>
          </div>

          {/* About section */}
          <div className="mt-8 pt-8 border-t border-spotify-gray">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Followers</h3>
                <p className="text-spotify-gray">
                  {artist.followers ? `${artist.followers.toLocaleString()} followers` : 'Information not available'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Popularity</h3>
                <p className="text-spotify-gray">
                  {artist.popularity ? `${artist.popularity}/100` : 'Information not available'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Genres</h3>
                <p className="text-spotify-gray">
                  {artist.genres && artist.genres.length > 0 ? artist.genres.join(', ') : 'No genres listed'}
                </p>
              </div>
            </div>
            
            {/* Additional info */}
            <div className="mt-6 p-4 bg-spotify-dark rounded-lg">
              <h3 className="font-semibold mb-2">Artist Information</h3>
              <div className="text-sm text-spotify-gray space-y-1">
                <p><strong>ID:</strong> {artist.id}</p>
                <p><strong>Name:</strong> {artist.name}</p>
                {artist.external_urls?.spotify && (
                  <p>
                    <strong>Spotify:</strong> 
                    <a 
                      href={artist.external_urls.spotify} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-spotify-green hover:text-white ml-2"
                    >
                      Open in Spotify
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
