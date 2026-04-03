import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { useUserData } from '../hooks/useUserData';
import { useSpotifyAPI } from '../hooks/useElectronAPI';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';
import { Track, Artist, Album } from '../../../shared/types';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const { recentlyPlayed } = useUserData();
  const { searchTracks } = useSpotifyAPI();
  const { currentTrack, isPlaying } = usePlayerStore();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const result = await searchTracks(query, 12, 0);
      const tracks = result?.tracks?.items || [];
      const artists = result?.artists?.items?.slice(0, 8) || [];
      const albums = tracks.map((t: any) => t.album).filter((v:any,i:any,a:any)=>v && a.findIndex((t:any)=>(t.id===v.id))===i).slice(0, 4);
      
      setSearchResults({ tracks, artists, albums });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    await audioPlayer.playTrack(track);
  };

  return (
    // Retour au h-screen avec scroll-smooth
    <main className="h-screen w-full overflow-y-auto bg-background text-white pb-32 scrollbar-hide scroll-smooth">
      
      {/* CORRECTION ICI : pt-24 pour décaler la barre sous ta navigation globale */}
      <div className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-xl px-4 sm:px-8 pt-24 pb-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Artists, songs, or podcasts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="w-full bg-surface-container border-none rounded-2xl py-4 pl-12 pr-6 text-base md:text-lg shadow-inner focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50 transition-all outline-none"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Tracks', 'Artists', 'Albums'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  activeFilter === filter 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        {!searchQuery ? (
          <section>
            <h2 className="text-xl md:text-2xl font-black mb-6">Recent Searches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {recentlyPlayed.slice(0, 6).map((item) => (
                <div key={item.track.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                  <img src={item.track.album.images[0].url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.track.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-medium">Song • {item.track.artists[0].name}</p>
                  </div>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : isSearching ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-40 bg-white/5 rounded-3xl"></div>
            <div className="h-64 bg-white/5 rounded-3xl"></div>
          </div>
        ) : searchResults ? (
          <div className="space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-5">
                <h3 className="text-xl font-bold mb-4">Top Result</h3>
                <div className="p-6 bg-white/5 rounded-3xl hover:bg-white/10 transition-all group cursor-pointer border border-white/5 relative overflow-hidden">
                  <img 
                    src={searchResults.tracks[0]?.album.images[0].url} 
                    className="w-28 h-28 rounded-2xl shadow-2xl mb-6 group-hover:scale-105 transition-transform duration-500" 
                    alt="" 
                  />
                  <h4 className="text-2xl md:text-4xl font-black mb-2 truncate">{searchResults.tracks[0]?.name}</h4>
                  <p className="text-on-surface-variant text-sm md:text-base font-medium">
                    Song • <span className="text-white">{searchResults.tracks[0]?.artists[0].name}</span>
                  </p>
                  <button 
                    onClick={() => handlePlayTrack(searchResults.tracks[0])}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-2xl lg:translate-y-2 lg:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"
                  >
                    <span className="material-symbols-outlined fill-1 text-3xl">play_arrow</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <h3 className="text-xl font-bold mb-4">Songs</h3>
                <div className="space-y-1">
                  {searchResults.tracks.slice(0, 5).map((track: any) => (
                    <div 
                      key={track.id} 
                      onClick={() => handlePlayTrack(track)}
                      className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <img src={track.album.images[0].url} className="w-10 h-10 rounded-md object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${currentTrack?.id === track.id ? 'text-primary' : ''}`}>{track.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{track.artists[0].name}</p>
                      </div>
                      <span className="text-xs text-on-surface-variant font-mono hidden sm:block">3:45</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Artists Section - Grille auto-adaptative */}
            <section className="pb-10">
              <h3 className="text-xl font-bold mb-6">Artists</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {searchResults.artists.map((artist: any) => {
                  const imageUrl = artist.images?.[0]?.url;
                  
                  return (
                    <div key={artist.id} className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all text-center group cursor-pointer">
                      <div className="relative aspect-square mb-4 overflow-hidden rounded-full mx-auto w-3/4 shadow-xl bg-surface-container flex items-center justify-center border border-white/5">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            alt={artist.name} 
                          />
                        ) : (
                          /* Fallback : Première lettre du nom de l'artiste */
                          <span className="text-4xl font-black text-on-surface-variant group-hover:scale-110 transition-transform duration-500">
                            {artist.name ? artist.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm truncate">{artist.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest font-bold">Artist</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-7xl mb-4">search_insights</span>
            <p className="text-lg font-medium">Find your next favorite song</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default SearchPage;