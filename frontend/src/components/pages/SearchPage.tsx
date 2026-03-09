import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import { usePlayer } from '../../contexts/PlayerContext';
import { TrackItem } from '../TrackItem';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const { performSearch, searchResults, isLoading, error } = useSearch();
  const { play } = usePlayer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handlePlayTrack = (track: any) => {
    play(track);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Rechercher</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Que voulez-vous écouter ?"
            className="w-full bg-white bg-opacity-10 rounded-full py-4 pl-16 pr-6 text-white placeholder-gray-400 focus:bg-opacity-20 outline-none transition-all"
          />
        </div>
      </form>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
          <p className="mt-4 text-gray-300">Recherche en cours...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {searchResults && searchResults.tracks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Résultats de recherche</h2>
          <div className="space-y-2">
            {searchResults.tracks.map((track, index) => (
              <TrackItem
                key={`${track.identifier}-${index}`}
                track={track}
                onPlay={handlePlayTrack}
                showAlbum={true}
                showArtist={true}
                showDuration={true}
              />
            ))}
          </div>
        </div>
      )}

      {searchResults && searchResults.tracks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-300">Aucun résultat trouvé pour "{query}"</p>
        </div>
      )}
    </div>
  );
};
