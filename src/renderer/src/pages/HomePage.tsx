import React, { useState, useEffect } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { Track } from '../../../shared/types';
import { audioPlayer } from '../services/audioPlayer';

const HomePage: React.FC = () => {
  const { recentlyPlayed, isLoading: userDataLoading, addToRecentlyPlayed } = useUserData();
  const { dailyMixes, madeForYou, isLoading: discoveryLoading } = useDiscoveryData();
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18) setGreeting('Good evening');
    else if (hour >= 12) setGreeting('Good afternoon');
    else setGreeting('Good morning');
  }, []);

  const displayRecentlyPlayed = React.useMemo(() => {
    return recentlyPlayed.slice(0, 6).map(item => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0]?.name || 'Unknown Artist',
      albumArt: item.track.album.images[0]?.url || 'https://via.placeholder.com/150'
    }));
  }, [recentlyPlayed]);

  const handlePlayTrack = async (trackData: any) => {
    try {
      const originalTrack = recentlyPlayed.find(item => item.track.id === trackData.id)?.track;
      if (originalTrack) {
        await audioPlayer.playTrack(originalTrack);
        addToRecentlyPlayed(originalTrack);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  return (
    <main className="h-screen overflow-y-auto bg-background text-white pb-32">
      {/* Hero Section with Dynamic Gradient */}
      <section className="relative pt-24 pb-12 px-6 bg-gradient-to-b from-primary/20 via-background to-background">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tight mb-2">
            {greeting}, <span className="text-primary">Alex</span>
          </h1>
          <p className="text-on-surface-variant text-lg font-medium opacity-80">
            Find your rhythm for the rest of the day.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Recently Played - Layout compact style "Spotify" */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Recently Played</h2>
            <button className="text-sm font-bold text-primary hover:underline transition-all">Show all</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {userDataLoading ? (
              [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              displayRecentlyPlayed.map((item) => (
                <div key={item.id} className="group relative bg-surface-container/30 hover:bg-surface-container/60 p-4 rounded-2xl transition-all duration-300">
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-xl shadow-lg">
                    <img 
                      src={item.albumArt} 
                      alt={item.title} 
                      className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <button 
                      onClick={() => handlePlayTrack(item)}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-2xl hover:scale-110"
                    >
                      <span className="material-symbols-outlined fill-1">play_arrow</span>
                    </button>
                  </div>
                  <h3 className="font-bold text-sm truncate mb-1">{item.title}</h3>
                  <p className="text-xs text-on-surface-variant truncate font-medium">{item.artist}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Daily Mixes - Large Cards with Overlays */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Your Daily Mixes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {discoveryLoading ? (
              [...Array(3)].map((_, i) => <SkeletonLarge key={i} />)
            ) : (
              dailyMixes.slice(0, 3).map((mix) => (
                <div key={mix.id} className="group relative aspect-[16/10] overflow-hidden rounded-3xl cursor-pointer shadow-xl">
                  <img src={mix.coverArt} alt={mix.name} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent group-hover:via-black/40 transition-colors" />
                  
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex justify-between items-end">
                      <div className="flex-1 mr-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-2 block">Daily Mix</span>
                        <h3 className="text-2xl font-black mb-1">{mix.name}</h3>
                        <p className="text-sm text-gray-300 line-clamp-1">{mix.description}</p>
                      </div>
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300">
                        <span className="material-symbols-outlined">play_arrow</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Made For You - Clean Horizontal Scroll feeling */}
        <section className="pb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Specialy Curated</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {madeForYou.slice(0, 3).map((playlist) => (
              <div key={playlist.id} className="flex items-center gap-4 bg-surface-container/20 p-3 rounded-2xl border border-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                <img src={playlist.coverArt} className="w-20 h-20 rounded-lg object-cover" alt="" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold truncate">{playlist.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{playlist.description}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 text-primary">
                   <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

// Petits composants utilitaires pour le chargement
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-square bg-surface-container rounded-2xl mb-4"></div>
    <div className="h-4 bg-surface-container rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-surface-container rounded w-1/2"></div>
  </div>
);

const SkeletonLarge = () => (
  <div className="animate-pulse aspect-[16/10] bg-surface-container rounded-3xl"></div>
);

export default HomePage;