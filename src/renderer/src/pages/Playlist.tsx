import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, Heart, MoreHorizontal, Clock, Download } from 'lucide-react';
import { usePlaylistAPI } from '../hooks/useElectronAPI';
import { usePlayerStore } from '../stores/playerStore';
import { Playlist, Track } from '@shared/types';

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const { getPlaylists } = usePlaylistAPI();
  const { currentTrack, setPlaying, setCurrentTrack } = usePlayerStore();

  useEffect(() => {
    if (id) {
      loadPlaylist(id);
    }
  }, [id]);

  const loadPlaylist = async (playlistId: string) => {
    try {
      setIsLoading(true);
      const playlists = await getPlaylists();
      const foundPlaylist = playlists.find(p => p.id === playlistId);
      setPlaylist(foundPlaylist || null);
    } catch (error) {
      console.error('Failed to load playlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPlaylist = async () => {
    if (!playlist || playlist.tracks.length === 0) return;

    const firstTrack = playlist.tracks[0];
    setCurrentTrack(firstTrack);
    setPlaying(true);
    setIsPlaying(true);
  };

  const handlePlayTrack = async (track: Track) => {
    setCurrentTrack(track);
    setPlaying(true);
  };

  const formatDuration = (duration_ms: number) => {
    const minutes = Math.floor(duration_ms / 60000);
    const seconds = Math.floor((duration_ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!playlist) return '0 min';
    const totalMs = playlist.tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-end gap-6">
            <div className="w-56 h-56 bg-spotify-highlight rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-4 bg-spotify-highlight rounded w-32"></div>
              <div className="h-8 bg-spotify-highlight rounded w-64"></div>
              <div className="h-4 bg-spotify-highlight rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="w-4 h-4 bg-spotify-highlight rounded"></div>
                <div className="w-12 h-12 bg-spotify-highlight rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-spotify-highlight rounded w-3/4"></div>
                  <div className="h-3 bg-spotify-highlight rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-spotify-highlight rounded w-24"></div>
                <div className="h-4 bg-spotify-highlight rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Playlist not found</h2>
          <Link to="/library" className="btn-primary">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Playlist Header */}
      <div className="flex items-end gap-6 mb-8">
        <div className="w-56 h-56 bg-spotify-highlight rounded-lg flex items-center justify-center">
          <Play size={64} className="text-spotify-gray" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase mb-2">Playlist</p>
          <h1 className="text-6xl font-bold mb-6">{playlist.name}</h1>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold">OpenSound</span>
            <span className="text-spotify-gray">•</span>
            <span className="text-spotify-gray">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
            </span>
            <span className="text-spotify-gray">•</span>
            <span className="text-spotify-gray">{getTotalDuration()}</span>
          </div>
          
          {playlist.description && (
            <p className="text-spotify-gray mt-2">{playlist.description}</p>
          )}
        </div>
      </div>

      {/* Play Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handlePlayPlaylist}
          className="bg-spotify-green text-black rounded-full p-4 hover:scale-105 transition-transform"
        >
          {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
        </button>
        
        <button className="text-spotify-gray hover:text-white transition-colors">
          <Heart size={32} />
        </button>
        
        <button className="text-spotify-gray hover:text-white transition-colors">
          <Download size={24} />
        </button>
        
        <button className="text-spotify-gray hover:text-white transition-colors ml-auto">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-spotify-highlight text-sm text-spotify-gray uppercase">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Album</div>
          <div className="col-span-2">Date Added</div>
          <div className="col-span-1 flex justify-end">
            <Clock size={16} />
          </div>
        </div>

        {/* Tracks */}
        {playlist.tracks.map((track, index) => (
          <div
            key={track.id}
            className={`track-card grid grid-cols-12 gap-4 px-4 py-2 ${
              currentTrack?.id === track.id ? 'playing' : ''
            }`}
            onClick={() => handlePlayTrack(track)}
          >
            <div className="col-span-1 flex items-center text-spotify-gray font-medium">
              {currentTrack?.id === track.id && isPlaying ? (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-spotify-green animate-pulse"></div>
                  <div className="w-1 h-4 bg-spotify-green animate-pulse delay-75"></div>
                  <div className="w-1 h-3 bg-spotify-green animate-pulse delay-150"></div>
                </div>
              ) : (
                index + 1
              )}
            </div>
            
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              {track.album?.images?.[0] && (
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
                  className="w-10 h-10 rounded"
                />
              )}
              <div className="min-w-0">
                <h4 className="font-medium truncate">{track.name}</h4>
                <p className="text-sm text-spotify-gray truncate">
                  {track.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
            
            <div className="col-span-3 flex items-center text-spotify-gray truncate">
              {track.album.name}
            </div>
            
            <div className="col-span-2 flex items-center text-spotify-gray text-sm">
              {new Date(playlist.updatedAt).toLocaleDateString()}
            </div>
            
            <div className="col-span-1 flex items-center justify-end text-spotify-gray text-sm">
              {formatDuration(track.duration_ms)}
            </div>
          </div>
        ))}
      </div>

      {playlist.tracks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-spotify-gray mb-4">
            <Play size={48} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold mb-2">This playlist is empty</h3>
          <p className="text-spotify-gray mb-6">
            Add tracks to this playlist to see them here
          </p>
        </div>
      )}
    </div>
  );
}
