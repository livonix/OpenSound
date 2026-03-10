import { create } from 'zustand';
import { Track, Album, Artist, SearchResult } from '@shared/types';

interface SearchStore {
  // State
  query: string;
  results: {
    tracks: Track[];
    albums: Album[];
    artists: Artist[];
  };
  isLoading: boolean;
  error: string | null;
  searchType: 'tracks' | 'albums' | 'artists' | 'all';

  // Actions
  setQuery: (query: string) => void;
  setResults: (results: SearchResult) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchType: (type: 'tracks' | 'albums' | 'artists' | 'all') => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  // Initial state
  query: '',
  results: {
    tracks: [],
    albums: [],
    artists: [],
  },
  isLoading: false,
  error: null,
  searchType: 'all',

  // Actions
  setQuery: (query) => set({ query }),
  setResults: (searchResults) => set({
    results: {
      tracks: searchResults.tracks?.items || [],
      albums: [], // Would need separate API call
      artists: [], // Would need separate API call
    },
  }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchType: (searchType) => set({ searchType }),
  clearResults: () => set({
    results: {
      tracks: [],
      albums: [],
      artists: [],
    },
    error: null,
  }),
}));
