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
      console.log('Loading real Spotify discovery data...');

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
          coverArt: cat.icons?.[0]?.url || 'https://via.placeholder.com/300'
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
      coverArt: 'https://via.placeholder.com/300/1DB954/000000?text=Daily+Mix+1',
      tracks: []
    },
    {
      id: 'daily-mix-2',
      name: 'Daily Mix 2',
      description: 'More of what you love',
      coverArt: 'https://via.placeholder.com/300/1ED760/000000?text=Daily+Mix+2',
      tracks: []
    },
    {
      id: 'daily-mix-3',
      name: 'Daily Mix 3',
      description: 'Discoveries we think you\'ll like',
      coverArt: 'https://via.placeholder.com/300/1ED760/000000?text=Daily+Mix+3',
      tracks: []
    }
  ];

  const getDemoMadeForYou = (): MadeForYou[] => [
    {
      id: 'discover-weekly',
      name: 'Discover Weekly',
      description: 'Your weekly mixtape of fresh music',
      coverArt: 'https://via.placeholder.com/300/FF6B6B/000000?text=Discover+Weekly',
      tracks: []
    },
    {
      id: 'release-radar',
      name: 'Release Radar',
      description: 'New music from artists you follow',
      coverArt: 'https://via.placeholder.com/300/4ECDC4/000000?text=Release+Radar',
      tracks: []
    },
    {
      id: 'time-capsule',
      name: 'Time Capsule',
      description: 'Flashback to your favorites',
      coverArt: 'https://via.placeholder.com/300/95E1D3/000000?text=Time+Capsule',
      tracks: []
    }
  ];

  const getDemoCategories = (): Category[] => [
    {
      id: 'pop',
      name: 'Pop',
      description: 'The latest and greatest in pop music',
      coverArt: 'https://via.placeholder.com/300/FF6B6B/000000?text=Pop'
    },
    {
      id: 'rock',
      name: 'Rock',
      description: 'Rock classics and new releases',
      coverArt: 'https://via.placeholder.com/300/4ECDC4/000000?text=Rock'
    },
    {
      id: 'hip-hop',
      name: 'Hip Hop',
      description: 'The best in hip hop and rap',
      coverArt: 'https://via.placeholder.com/300/95E1D3/000000?text=Hip+Hop'
    },
    {
      id: 'electronic',
      name: 'Electronic',
      description: 'Electronic music and dance hits',
      coverArt: 'https://via.placeholder.com/300/F38181/000000?text=Electronic'
    }
  ];

  const refreshDailyMixes = async () => {
    try {
      const dailyMixesData = await api.getDailyMixes();
      if (dailyMixesData) {
        setDailyMixes(dailyMixesData);
      } else {
        setDailyMixes(getDemoDailyMixes());
      }
    } catch (error) {
      console.error('Failed to refresh daily mixes:', error);
      setDailyMixes(getDemoDailyMixes());
    }
  };

  const refreshMadeForYou = async () => {
    try {
      const madeForYouData = await api.getMadeForYou();
      if (madeForYouData) {
        setMadeForYou(madeForYouData);
      } else {
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