import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDiscoveryData } from '../hooks/useDiscoveryData';
import { useUserData } from '../hooks/useUserData';
import { useSpotifyAPI } from '../hooks/useElectronAPI';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';
import { Track, Artist, Album } from '../../../shared/types';

interface SearchResult {
  tracks: {
    items: Track[];
    total: number;
    limit: number;
    offset: number;
  };
  artists: Artist[];
  albums: Album[];
  playlists: any[];
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { categories, isLoading: categoriesLoading } = useDiscoveryData();
  const { recentlyPlayed } = useUserData();
  const { searchTracks, getArtist, getAlbum } = useSpotifyAPI();
  const { setCurrentTrack, setPlaying, currentTrack, isPlaying } = usePlayerStore();

  const handlePlayTrack = async (track: Track) => {
    try {
      console.log('Playing track from search:', track.name);
      
      // Use the audioPlayer service which handles everything
      await audioPlayer.playTrack(track);
      
      console.log('Track play initiated successfully');
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  // Format recent searches from recently played tracks
  const recentSearches = recentlyPlayed.slice(0, 3).map(item => ({
    id: item.track.id,
    title: item.track.name,
    type: 'Song' as string,
    subtitle: 'Song • ' + item.track.artists[0]?.name,
    image: item.track.album.images[0]?.url || 'https://via.placeholder.com/64'
  }));

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    console.log('Starting search for query:', query);
    setIsSearching(true);
    try {
      // Search for tracks using Spotify API
      const searchResult = await searchTracks(query, 10, 0);
      console.log('Raw search result from API:', searchResult);
      console.log('Search result structure:', {
        hasTracks: !!searchResult?.tracks,
        hasItems: !!searchResult?.tracks?.items,
        itemsLength: searchResult?.tracks?.items?.length,
        firstTrack: searchResult?.tracks?.items?.[0]
      });
      
      const tracks = searchResult?.tracks?.items || [];
      console.log('Extracted tracks:', tracks.length, tracks);
      
      // Search for artists - we need to create a separate search method or modify the existing one
      // For now, let's search for tracks and extract artists from the results
      const artistsFromTracks = tracks
        ?.slice(0, 5)
        .map((track: Track) => track.artists[0])
        .filter((artist: Artist | undefined, index: number, self: Artist[]) => 
          artist && self.findIndex((a: Artist) => a.id === artist.id) === index
        ) || [];
      
      // Search for albums - extract from track results
      const albumsFromTracks = tracks
        ?.slice(0, 5)
        .map((track: Track) => track.album)
        .filter((album: Album | undefined, index: number, self: Album[]) => 
          album && self.findIndex((a: Album) => a.id === album.id) === index
        ) || [];

      setSearchResults({
        tracks: searchResult?.tracks || { items: [], total: 0, limit: 10, offset: 0 },
        artists: artistsFromTracks,
        albums: albumsFromTracks,
        playlists: [] // TODO: Implement playlist search
      });
      
      console.log('Search results set:', {
        tracksCount: tracks.length,
        artistsCount: artistsFromTracks.length,
        albumsCount: albumsFromTracks.length
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter pressed, searching for:', searchQuery);
      handleSearch(searchQuery);
    }
  };

  useEffect(() => {
    // Initial search if query is in URL
    if (initialQuery && !searchResults) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const clearRecentSearch = (id: string) => {
    // TODO: Implement clearing recent searches
    console.log('Clear recent search:', id);
  };

  const clearAllRecentSearches = () => {
    // TODO: Implement clearing all recent searches
    console.log('Clear all recent searches');
  };

  // Debug log for render state
  useEffect(() => {
    console.log('SearchPage render state:', { searchQuery, hasResults: !!searchResults, isSearching });
  }, [searchQuery, searchResults, isSearching]);

  return (
    <main className="pt-20 pb-32 px-4 h-screen overflow-y-auto scroll-smooth">
      {/* Search Input */}
      <div className="mb-8">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search artists, songs, or albums..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full bg-surface-container-low border-none rounded-full py-3 pl-10 pr-4 text-lg focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant"
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2 text-center">Press Enter to search</p>
        </div>
      </div>

      {/* Search Results Section */}
      {searchQuery && (
        <section className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold font-headline">Search Results for "{searchQuery}"</h2>
            {isSearching && (
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
            )}
          </div>

          {/* DEBUG: Afficher les infos de base */}
          <div className="bg-surface-container p-4 rounded-xl mb-4">
            <p className="text-sm">Debug Info:</p>
            <p className="text-xs">Has results: {!!searchResults}</p>
            <p className="text-xs">Tracks count: {searchResults?.tracks?.items?.length || 0}</p>
            <p className="text-xs">Is searching: {isSearching}</p>
            {searchResults?.tracks?.items?.[0] && (
              <p className="text-xs">First track: {searchResults.tracks.items[0].name}</p>
            )}
          </div>

          {searchResults && !isSearching && (
            <div className="space-y-8">
              {/* Tracks Results */}
              {searchResults.tracks.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-headline mb-4">Tracks</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {searchResults.tracks.items.map((track) => (
                      <div key={track.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer">
                        <img
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          alt={track.name}
                          src={track.album.images[0]?.url || 'https://via.placeholder.com/48'}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold font-headline text-sm truncate">{track.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {track.artists.map(artist => artist.name).join(', ')}
                          </p>
                        </div>
                        <button 
                          onClick={() => handlePlayTrack(track)}
                          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                            {currentTrack?.id === track.id && isPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artists Results */}
              {searchResults.artists.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-headline mb-4">Artists</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.artists.map((artist) => (
                      <div key={artist.id} className="text-center group cursor-pointer">
                        <img
                          className="w-full aspect-square rounded-full object-cover mb-3 group-hover:scale-105 transition-transform"
                          alt={artist.name}
                          src={artist.images?.[0]?.url || 'https://via.placeholder.com/200'}
                        />
                        <p className="font-bold font-headline text-sm truncate">{artist.name}</p>
                        <p className="text-xs text-on-surface-variant">Artist</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Results */}
              {searchResults.albums.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold font-headline mb-4">Albums</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.albums.map((album) => (
                      <div key={album.id} className="group cursor-pointer">
                        <img
                          className="w-full aspect-square rounded-xl object-cover mb-3 group-hover:scale-105 transition-transform"
                          alt={album.name}
                          src={album.images[0]?.url || 'https://via.placeholder.com/200'}
                        />
                        <p className="font-bold font-headline text-sm truncate">{album.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {album.artists.map(artist => artist.name).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchResults.tracks.items.length === 0 && 
               searchResults.artists.length === 0 && 
               searchResults.albums.length === 0 && (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
                    search_off
                  </span>
                  <p className="text-on-surface-variant">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Recent Searches Section */}
      {!searchQuery && (
        <section className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-headline">Recent Searches</h2>
            <button 
              className="text-xs font-bold font-label text-on-surface-variant hover:text-primary transition-colors"
              onClick={clearAllRecentSearches}
            >
              Clear all
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((search) => (
              <div key={search.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-high transition-all">
                <div className="flex items-center gap-4">
                  <img
                    className={`w-12 h-12 ${
                      search.type === 'Artist' ? 'rounded-full grayscale group-hover:grayscale-0' : 'rounded-xl'
                    } object-cover transition-all`}
                    alt={search.title}
                    src={search.image}
                  />
                  <div>
                    <p className="font-bold font-headline">{search.title}</p>
                    <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest">{search.subtitle}</p>
                  </div>
                </div>
                <button 
                  className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-error transition-all"
                  onClick={() => clearRecentSearch(search.id)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default SearchPage;
