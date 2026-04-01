import { useEffect, useState } from 'react';
import { useElectronAPI } from './useElectronAPI';
import { Track, Artist, Playlist } from '../../../shared/types';

interface DailyMix {
  id: string;
  name: string;
  description: string;
  coverArt: string;
  tracks: Track[];
}

interface MadeForYou {
  id: string;
  name: string;
  description: string;
  coverArt: string;
  tracks: Track[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  coverArt: string;
}

export function useDiscoveryData() {
  const { api, isReady } = useElectronAPI();
  const [dailyMixes, setDailyMixes] = useState<DailyMix[]>([]);
  const [madeForYou, setMadeForYou] = useState<MadeForYou[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isReady && api) {
      loadDiscoveryData();
    }
  }, [isReady, api]);

  const loadDiscoveryData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading discovery data...');

      // Check if API has the required methods, otherwise use demo data
      if (api && typeof api.getBrowseCategories === 'function') {
        // Load browse categories
        const categoriesData = await api.getBrowseCategories();
        console.log('Categories loaded:', categoriesData?.categories?.items?.length || 0);

        // Load daily mixes
        const dailyMixesData = await api.getDailyMixes();
        console.log('Daily mixes loaded:', dailyMixesData?.length || 0);

        // Load made for you playlists
        const madeForYouData = await api.getMadeForYou();
        console.log('Made for you loaded:', madeForYouData?.length || 0);

        // Format and set data
        if (categoriesData?.categories?.items) {
          const formattedCategories = categoriesData.categories.items.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            coverArt: cat.icons?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzg4ODg4OCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+T8KAVjwvdGV4dD48L3N2Zz4='
          }));
          setCategories(formattedCategories);
        }

        if (dailyMixesData) {
          setDailyMixes(dailyMixesData);
        } else {
          setDailyMixes(getDemoDailyMixes());
        }

        if (madeForYouData) {
          setMadeForYou(madeForYouData);
        } else {
          setMadeForYou(getDemoMadeForYou());
        }
      } else {
        console.log('Discovery API methods not available, using demo data');
        // Use demo data when API methods are not available
        setDailyMixes(getDemoDailyMixes());
        setCategories(getDemoCategories());
        setMadeForYou(getDemoMadeForYou());
      }

    } catch (error) {
      console.error('Failed to load discovery data:', error);
      // Fallback to demo data
      setDailyMixes(getDemoDailyMixes());
      setCategories(getDemoCategories());
      setMadeForYou(getDemoMadeForYou());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoDailyMixes = (): DailyMix[] => [
    {
      id: 'daily-mix-1',
      name: 'Daily Mix 1',
      description: 'Your favorites mixed with new discoveries',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFEQjk1NCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RGFpbHkgTWl4IDE8L3RleHQ+PC9zdmc+',
      tracks: []
    },
    {
      id: 'daily-mix-2',
      name: 'Daily Mix 2',
      description: 'More of what you love',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFFRDc2MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RGFpbHkgTWl4IDI8L3RleHQ+PC9zdmc+',
      tracks: []
    },
    {
      id: 'daily-mix-3',
      name: 'Daily Mix 3',
      description: 'Discoveries we think you\'ll like',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFFRDc2MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RGFpbHkgTWl4IDM8L3RleHQ+PC9zdmc+',
      tracks: []
    }
  ];

  const getDemoMadeForYou = (): MadeForYou[] => [
    {
      id: 'discover-weekly',
      name: 'Discover Weekly',
      description: 'Your weekly mixtape of fresh music',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RGlzY292ZXIgV2Vla2x5PC90ZXh0Pjwvc3ZnPg==',
      tracks: []
    },
    {
      id: 'release-radar',
      name: 'Release Radar',
      description: 'New music from artists you follow',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRFQ0RDMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+UmVsZWFzZSBSYWRhcjwvdGV4dD48L3N2Zz4=',
      tracks: []
    },
    {
      id: 'time-capsule',
      name: 'Time Capsule',
      description: 'Flashback to your favorites',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzk1RTFEMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+VGltZSBDYXBzdWxlPC90ZXh0Pjwvc3ZnPg==',
      tracks: []
    }
  ];

  const getDemoCategories = (): Category[] => [
    {
      id: 'pop',
      name: 'Pop',
      description: 'The latest and greatest in pop music',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+UG9wPC90ZXh0Pjwvc3ZnPg=='
    },
    {
      id: 'rock',
      name: 'Rock',
      description: 'Rock classics and new releases',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRFQ0RDMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+Um9jazwvdGV4dD48L3N2Zz4=='
    },
    {
      id: 'hip-hop',
      name: 'Hip Hop',
      description: 'The best in hip hop and rap',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzk1RTFEMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+SGlwIEhvcDwvdGV4dD48L3N2Zz4=='
    },
    {
      id: 'electronic',
      name: 'Electronic',
      description: 'Electronic music and dance hits',
      coverArt: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0YzODE4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RWxlY3Ryb25pYzwvdGV4dD48L3N2Zz4=='
    }
  ];

  const refreshDailyMixes = async () => {
    try {
      if (api && typeof api.getDailyMixes === 'function') {
        const dailyMixesData = await api.getDailyMixes();
        if (dailyMixesData) {
          setDailyMixes(dailyMixesData);
        } else {
          setDailyMixes(getDemoDailyMixes());
        }
      } else {
        console.log('getDailyMixes method not available, using demo data');
        setDailyMixes(getDemoDailyMixes());
      }
    } catch (error) {
      console.error('Failed to refresh daily mixes:', error);
      setDailyMixes(getDemoDailyMixes());
    }
  };

  const refreshMadeForYou = async () => {
    try {
      if (api && typeof api.getMadeForYou === 'function') {
        const madeForYouData = await api.getMadeForYou();
        if (madeForYouData) {
          setMadeForYou(madeForYouData);
        } else {
          setMadeForYou(getDemoMadeForYou());
        }
      } else {
        console.log('getMadeForYou method not available, using demo data');
        setMadeForYou(getDemoMadeForYou());
      }
    } catch (error) {
      console.error('Failed to refresh made for you:', error);
      setMadeForYou(getDemoMadeForYou());
    }
  };

  return {
    dailyMixes,
    madeForYou,
    categories,
    isLoading,
    refreshDailyMixes,
    refreshMadeForYou,
    loadDiscoveryData
  };
}