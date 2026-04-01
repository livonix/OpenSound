import React, { useState, useEffect } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { Track } from '../../../shared/types';
import { audioPlayer } from '../services/audioPlayer';

const HomePage: React.FC = () => {
  const { recentlyPlayed, isLoading: userDataLoading, addToRecentlyPlayed } = useUserData();
  const { dailyMixes, madeForYou, isLoading: discoveryLoading } = useDiscoveryData();
  const [userName, setUserName] = useState('Alex');

  useEffect(() => {
    // For now, use a default name since getUserProfile is not implemented
    // TODO: Implement getUserProfile in IPC when we have OAuth authentication
    setUserName('Alex');
  }, []);

  // Format recently played tracks for display
  const displayRecentlyPlayed = React.useMemo(() => {
    console.log('🏠 HomePage: recentlyPlayed updated:', recentlyPlayed.length, 'tracks');
    return recentlyPlayed.slice(0, 6).map(item => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0]?.name || 'Unknown Artist',
      albumArt: item.track.album.images[0]?.url || 'https://via.placeholder.com/64'
    }));
  }, [recentlyPlayed]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = async (trackData: any) => {
    try {
      console.log('🏠 HomePage: handlePlayTrack called for:', trackData.title);
      
      // Use the original track from recentlyPlayed data
      const originalTrack = recentlyPlayed.find(item => item.track.id === trackData.id)?.track;
      if (originalTrack) {
        console.log('🏠 HomePage: Playing track and adding to recently played:', originalTrack.name);
        await audioPlayer.playTrack(originalTrack);
        // Add to recently played
        addToRecentlyPlayed(originalTrack);
        console.log('🏠 HomePage: addToRecentlyPlayed called');
      } else {
        console.log('🏠 HomePage: Track not found in recentlyPlayed, creating new track object');
        // Si la musique n'est pas dans recentlyPlayed, on la crée à partir des données
        const newTrack: Track = {
          id: trackData.id,
          name: trackData.title,
          artists: [{ name: trackData.artist, id: '', external_urls: { spotify: '' } }],
          album: {
            id: '',
            name: '',
            images: [{ url: trackData.albumArt, height: 64, width: 64 }],
            release_date: '',
            total_tracks: 1,
            artists: [],
            external_urls: { spotify: '' }
          },
          duration_ms: 0,
          explicit: false,
          external_urls: { spotify: '' },
          preview_url: '',
          uri: ''
        };
        
        await audioPlayer.playTrack(newTrack);
        addToRecentlyPlayed(newTrack);
        console.log('🏠 HomePage: New track added to recently played');
      }
    } catch (error) {
      console.error('🏠 HomePage: Error playing track:', error);
    }
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
                    <button 
                      onClick={() => handlePlayTrack(item)}
                      className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed transform translate-y-12 group-hover:translate-y-0 transition-transform"
                    >
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

          </main>
  );
};

export default HomePage;
