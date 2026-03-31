import React, { useState, useEffect } from 'react';
import { UserPlus, Play, MoreHorizontal } from 'lucide-react';
import { useFollowedArtists } from '../hooks/useFollowedArtists';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';
import { Artist } from '../../../shared/types';

export function Artists() {
  const { followedArtists, isLoading, refreshFollowedArtists, unfollowArtist } = useFollowedArtists();
  const { setCurrentTrack } = usePlayerStore();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  useEffect(() => {
    refreshFollowedArtists();
  }, [refreshFollowedArtists]);

  const handlePlayArtist = async (artist: Artist) => {
    try {
      console.log('🎵 Playing artist:', artist.name);
      // This would require getting artist's top tracks from Spotify API
      // For now, we'll just show a message
      console.log('📝 Artist playback not implemented yet');
    } catch (error) {
      console.error('❌ Failed to play artist:', error);
    }
  };

  const handleUnfollow = async (artistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await unfollowArtist(artistId);
    } catch (error) {
      console.error('Failed to unfollow artist:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-spotify-highlight rounded-lg w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="w-full aspect-square bg-spotify-highlight rounded-lg"></div>
                <div className="h-4 bg-spotify-highlight rounded"></div>
                <div className="h-3 bg-spotify-highlight rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Artists</h1>
        <div className="text-sm text-spotify-gray">
          {followedArtists.length} {followedArtists.length === 1 ? 'artist' : 'artists'}
        </div>
      </div>

      {followedArtists.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {followedArtists.map((artist) => (
            <div
              key={artist.id}
              className="card group cursor-pointer"
              onClick={() => setSelectedArtist(artist)}
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
                      <UserPlus size={48} />
                    </div>
                  </div>
                )}
                <button
                  className="absolute bottom-2 right-2 bg-spotify-green text-white rounded-full p-3 opacity-0 group-hover:opacity-100 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayArtist(artist);
                  }}
                >
                  <Play size={20} fill="white" />
                </button>
                <button
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleUnfollow(artist.id, e)}
                  title="Unfollow"
                >
                  <UserPlus size={16} />
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
              <UserPlus size={48} className="text-spotify-gray" />
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
            <UserPlus size={20} />
            Browse Artists
          </button>
        </div>
      )}

      {/* Artist Detail Modal */}
      {selectedArtist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-spotify-highlight rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              {selectedArtist.images?.[0] ? (
                <img
                  src={selectedArtist.images[0].url}
                  alt={selectedArtist.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-spotify-highlight rounded-lg flex items-center justify-center">
                  <UserPlus size={32} className="text-spotify-gray" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{selectedArtist.name}</h2>
                <p className="text-spotify-gray">
                  {selectedArtist.followers ? `${selectedArtist.followers.toLocaleString()} followers` : 'Artist'}
                </p>
                {selectedArtist.genres && selectedArtist.genres.length > 0 && (
                  <p className="text-sm text-spotify-gray">
                    {selectedArtist.genres.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handlePlayArtist(selectedArtist)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Play size={20} fill="white" />
                Play Artist
              </button>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedArtist(null)}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
