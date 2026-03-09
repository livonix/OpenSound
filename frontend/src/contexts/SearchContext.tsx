import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SearchResult, Track } from '../types/music';
import { searchTracks } from '../services/api';
import { usePlayer } from './PlayerContext';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  performSearch: (query: string, source?: string) => Promise<void>;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackUserSearch } = usePlayer();

  const performSearch = async (query: string, source = 'ytsearch') => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchQuery(query);

    try {
      const results = await searchTracks(query, source);
      setSearchResults(results);
      
      // Track search for better recommendations
      await trackUserSearch(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la recherche');
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setSearchResults(null);
    setError(null);
    setSearchQuery('');
  };

  const value = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    performSearch,
    clearResults,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
