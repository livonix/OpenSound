import React, { useState, useEffect } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { useLikedSongs } from '../hooks/useLikedSongs';
import { Track } from '../../../shared/types';

const HomePage: React.FC = () => {
  const { recentlyPlayed, isLoading: userDataLoading } = useUserData();
  const { dailyMixes, madeForYou, isLoading: discoveryLoading } = useDiscoveryData();
  const { likedSongs } = useLikedSongs();
  const [userName, setUserName] = useState('Alex');

  useEffect(() => {
    // For now, use a default name since getUserProfile is not implemented
    // TODO: Implement getUserProfile in IPC when we have OAuth authentication
    setUserName('Alex');
  }, []);

  // Format recently played tracks for display
  const displayRecentlyPlayed = recentlyPlayed.slice(0, 6).map(item => ({
    id: item.track.id,
    title: item.track.name,
    artist: item.track.artists[0]?.name || 'Unknown Artist',
    albumArt: item.track.album.images[0]?.url || 'https://via.placeholder.com/64'
  }));

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <main className="pt-20 pb-32 px-4 h-screen overflow-y-auto scroll-smooth">
      {/* Welcome Section */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter">
              Welcome back, {userName}
            </h1>
            <p className="text-lg text-on-surface-variant mt-2">
              Your personal music library awaits
            </p>
          </div>
        </div>
      </section>

      {/* Recently Played Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">Recently Played</h2>
          <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            See all
          </button>
        </div>

        {userDataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-surface-container mb-2"></div>
                <div className="h-4 bg-surface-container rounded mb-1"></div>
                <div className="h-3 bg-surface-container rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayRecentlyPlayed.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <div className="relative mb-3">
                  <img
                    className="w-full aspect-square rounded-lg object-cover group-hover:scale-105 transition-transform"
                    alt={item.title}
                    src={item.albumArt}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed transform translate-y-12 group-hover:translate-y-0 transition-transform">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
                <p className="font-bold font-headline text-sm truncate">{item.title}</p>
                <p className="text-xs text-on-surface-variant truncate">{item.artist}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Daily Mixes Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">Your Daily Mixes</h2>
          <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            See all
          </button>
        </div>

        {discoveryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-surface-container mb-3"></div>
                <div className="h-4 bg-surface-container rounded mb-1"></div>
                <div className="h-3 bg-surface-container rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyMixes.slice(0, 3).map((mix) => (
              <div key={mix.id} className="group cursor-pointer">
                <div className="relative">
                  <img
                    className="w-full aspect-square rounded-xl object-cover group-hover:scale-105 transition-transform"
                    alt={mix.name}
                    src={mix.coverArt}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold font-headline text-lg mb-1">{mix.name}</p>
                    <p className="text-white/80 text-sm">{mix.description}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed opacity-0 group-hover:opacity-100 transform translate-y-12 group-hover:translate-y-0 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                      play_arrow
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Made For You Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">Made For You</h2>
          <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            See all
          </button>
        </div>

        {discoveryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-surface-container mb-3"></div>
                <div className="h-4 bg-surface-container rounded mb-1"></div>
                <div className="h-3 bg-surface-container rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {madeForYou.slice(0, 3).map((playlist) => (
              <div key={playlist.id} className="group cursor-pointer">
                <div className="relative">
                  <img
                    className="w-full aspect-square rounded-xl object-cover group-hover:scale-105 transition-transform"
                    alt={playlist.name}
                    src={playlist.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold font-headline text-lg mb-1">{playlist.name}</p>
                    <p className="text-white/80 text-sm">{playlist.description}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed opacity-0 group-hover:opacity-100 transform translate-y-12 group-hover:translate-y-0 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                      play_arrow
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liked Songs Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-headline">Liked Songs</h2>
          <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            See all
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-container rounded-2xl"></div>
          <div className="relative bg-surface/80 backdrop-blur-sm rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold font-headline mb-2">Your Favorite Tracks</h3>
                <p className="text-on-surface-variant mb-4">
                  {likedSongs?.tracks?.length || 0} {(likedSongs?.tracks?.length || 0) === 1 ? 'song' : 'songs'} • Updated daily
                </p>
                <button className="px-8 py-3 bg-primary text-on-primary-fixed rounded-full font-bold hover:bg-primary/90 transition-colors">
                  Play Liked Songs
                </button>
              </div>
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-primary">favorite</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
