import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useSpotifyAPI } from '../hooks/useElectronAPI';
import { usePlayerStore } from '../stores/playerStore';
import { Track } from '@shared/types';

export function Home() {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { searchTracks } = useSpotifyAPI();
  const { setCurrentTrack, setPlaying } = usePlayerStore();

  useEffect(() => {
    loadHomeContent();
  }, []);

  const loadHomeContent = async () => {
    try {
      setIsLoading(true);
      
      // Load some sample content - in a real app, these would be specific endpoints
      const featuredResult = await searchTracks('trending hits 2024', 10);
      const rockResult = await searchTracks('rock classics', 8);
      const electronicResult = await searchTracks('electronic music', 8);

      // Check if results exist and have tracks property
      setFeaturedTracks(featuredResult?.tracks?.items || []);
      setRecentlyPlayed(rockResult?.tracks?.items || []);
      setRecommendations(electronicResult?.tracks?.items || []);
    } catch (error) {
      console.error('Failed to load home content:', error);
      // Set empty arrays on error
      setFeaturedTracks([]);
      setRecentlyPlayed([]);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    setCurrentTrack(track);
    setPlaying(true);
  };

  const TrackCard = ({ track, size = 'normal' }: { track: Track; size?: 'small' | 'normal' | 'large' }) => {
    const imageSize = size === 'small' ? 'w-12 h-12' : size === 'large' ? 'w-32 h-32' : 'w-20 h-20';
    const textSize = size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm';

    return (
      <div className="group cursor-pointer" onClick={() => handlePlayTrack(track)}>
        <div className="relative mb-3">
          {track.album?.images?.[0] && (
            <img
              src={track.album.images[0].url}
              alt={track.name}
              className={`${imageSize} rounded-lg shadow-lg group-hover:shadow-xl transition-shadow`}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button className="bg-spotify-green text-white rounded-full p-2 hover:scale-105 transition-transform shadow-lg">
              <Play size={size === 'large' ? 24 : 16} fill="white" />
            </button>
          </div>
        </div>
        <h3 className={`font-semibold ${textSize} truncate mb-1`}>{track.name}</h3>
        <p className="text-spotify-gray ${textSize} truncate">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div>
            <div className="h-8 bg-spotify-highlight rounded w-48 mb-6"></div>
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="w-20 h-20 bg-spotify-highlight rounded-lg mb-3"></div>
                  <div className="h-4 bg-spotify-highlight rounded w-full mb-2"></div>
                  <div className="h-3 bg-spotify-highlight rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto">
      <div className="space-y-8">
        {/* Featured Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Tracks</h2>
            <button className="btn-ghost text-sm">Show all</button>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {featuredTracks.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>

        {/* Recently Played */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recently Played</h2>
            <button className="btn-ghost text-sm">Show all</button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {recentlyPlayed.slice(0, 4).map((track) => (
              <TrackCard key={track.id} track={track} size="large" />
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recommended for You</h2>
            <button className="btn-ghost text-sm">Show all</button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {recommendations.slice(0, 5).map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>

        {/* Quick Access */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-spotify-green to-green-600 rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform">
              <h3 className="text-xl font-bold mb-2">Discover</h3>
              <p className="text-sm opacity-90">Find new music tailored to your taste</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform">
              <h3 className="text-xl font-bold mb-2">Charts</h3>
              <p className="text-sm opacity-90">Top tracks and albums right now</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform">
              <h3 className="text-xl font-bold mb-2">New Releases</h3>
              <p className="text-sm opacity-90">The latest music from artists you love</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
