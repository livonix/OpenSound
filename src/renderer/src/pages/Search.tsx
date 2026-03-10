import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useSearchStore } from '../stores/searchStore';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';
import { Track } from '@shared/types';

export function Search() {
  const [searchInput, setSearchInput] = useState('');
  const { 
    query, 
    results, 
    isLoading, 
    error, 
    searchType,
    setQuery,
    setResults, 
    setIsLoading, 
    setError,
    setSearchType 
  } = useSearchStore();

  const { setCurrentTrack, setPlaying } = usePlayerStore();

  const searchTypes = [
    { value: 'all', label: 'All' },
    { value: 'tracks', label: 'Tracks' },
    { value: 'albums', label: 'Albums' },
    { value: 'artists', label: 'Artists' },
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput.trim()) {
        performSearch(searchInput);
      } else {
        setQuery('');
        setResults({ tracks: { items: [], total: 0, limit: 20, offset: 0 } });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setQuery(searchQuery);

      // Use Electron API directly
      const searchResults = await (window as any).electronAPI.searchTracks(searchQuery, 20);
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    try {
      await audioPlayer.playTrack(track);
    } catch (error) {
      console.error('Error playing track:', error);
      // You might want to show an error message to the user here
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setQuery('');
    setResults({ tracks: { items: [], total: 0, limit: 20, offset: 0 } });
    setError(null);
  };

  const formatDuration = (duration_ms: number) => {
    const minutes = Math.floor(duration_ms / 60000);
    const seconds = Math.floor((duration_ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Search</h1>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <SearchIcon 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-spotify-gray" 
            size={20} 
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="What do you want to listen to?"
            className="input-field pl-12 pr-12 py-4 text-lg w-full"
            autoFocus
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-spotify-gray hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Search Type Filter */}
        <div className="flex gap-2 mt-4">
          {searchTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSearchType(type.value as any)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                searchType === type.value
                  ? 'bg-white text-black'
                  : 'bg-spotify-highlight text-white hover:bg-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin-slow">
            <SearchIcon size={32} className="text-spotify-green" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => performSearch(query)} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && !error && query && results?.tracks && results.tracks.length > 0 && (
        <div className="space-y-6">
          {/* Tracks Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Tracks</h2>
            <div className="space-y-2">
              {results.tracks.map((track: Track, index: number) => (
                <div
                  key={track.id}
                  className="track-card group"
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="flex-shrink-0 w-8 text-spotify-gray font-medium">
                    {index + 1}
                  </div>
                  
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
                      {track.artists.map((a: any) => a.name).join(', ')}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 text-spotify-gray text-sm">
                    {track.album.name}
                  </div>
                  
                  <div className="flex-shrink-0 text-spotify-gray text-sm">
                    {formatDuration(track.duration_ms)}
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-spotify-green text-white rounded-full p-1 hover:scale-105 transition-transform">
                      <SearchIcon size={16} fill="white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Load More */}
          {/* Note: Load more functionality would need pagination support */}
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && query && results.tracks.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon size={48} className="text-spotify-gray mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No results found</h3>
          <p className="text-spotify-gray mb-6">
            Try searching with different keywords
          </p>
        </div>
      )}

      {/* Empty State */}
      {!query && !isLoading && !error && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-4">Browse categories</h3>
          <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: 'Pop', color: 'from-pink-500 to-rose-500' },
              { name: 'Hip-Hop', color: 'from-purple-500 to-indigo-500' },
              { name: 'Rock', color: 'from-red-500 to-orange-500' },
              { name: 'Electronic', color: 'from-blue-500 to-cyan-500' },
              { name: 'Jazz', color: 'from-yellow-500 to-amber-500' },
              { name: 'Classical', color: 'from-green-500 to-emerald-500' },
              { name: 'R&B', color: 'from-indigo-500 to-purple-500' },
              { name: 'Country', color: 'from-orange-500 to-red-500' },
            ].map((genre) => (
              <div
                key={genre.name}
                className={`bg-gradient-to-br ${genre.color} rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform`}
                onClick={() => setSearchInput(genre.name)}
              >
                <h4 className="text-lg font-bold">{genre.name}</h4>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
