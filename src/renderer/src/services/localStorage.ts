import { Track } from '../../../shared/types';

export interface StoredData {
  recentlyPlayed: Array<{
    track: Track;
    playedAt: string;
  }>;
  playlists: Array<{
    id: string;
    name: string;
    tracks: Track[];
    createdAt: string;
    updatedAt: string;
  }>;
  likedSongs: Track[];
  userPreferences: {
    userName: string;
    volume: number;
    repeat: 'off' | 'track' | 'context';
    shuffle: boolean;
  };
  searchHistory: string[];
  lastPlayedTrack?: Track;
  listeningStats: {
    totalPlayTime: number;
    tracksPlayed: number;
    sessionsCount: number;
    lastSession: string;
  };
}

const STORAGE_KEYS = {
  RECENTLY_PLAYED: 'opensound_recently_played',
  PLAYLISTS: 'opensound_playlists',
  LIKED_SONGS: 'opensound_liked_songs',
  USER_PREFERENCES: 'opensound_user_preferences',
  SEARCH_HISTORY: 'opensound_search_history',
  LAST_PLAYED: 'opensound_last_played',
  LISTENING_STATS: 'opensound_listening_stats'
} as const;

class LocalStorageService {
  // Recently Played
  saveRecentlyPlayed(tracks: Array<{ track: Track; playedAt: string }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(tracks));
      console.log('💾 Recently played saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save recently played:', error);
    }
  }

  getRecentlyPlayed(): Array<{ track: Track; playedAt: string }> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load recently played:', error);
      return [];
    }
  }

  // Playlists
  savePlaylists(playlists: Array<{ id: string; name: string; tracks: Track[]; createdAt: string; updatedAt: string }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      console.log('💾 Playlists saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save playlists:', error);
    }
  }

  getPlaylists(): Array<{ id: string; name: string; tracks: Track[]; createdAt: string; updatedAt: string }> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load playlists:', error);
      return [];
    }
  }

  // Liked Songs
  saveLikedSongs(songs: Track[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_SONGS, JSON.stringify(songs));
      console.log('💾 Liked songs saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save liked songs:', error);
    }
  }

  getLikedSongs(): Track[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKED_SONGS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load liked songs:', error);
      return [];
    }
  }

  // User Preferences
  saveUserPreferences(preferences: StoredData['userPreferences']): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      console.log('💾 User preferences saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save user preferences:', error);
    }
  }

  getUserPreferences(): StoredData['userPreferences'] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return stored ? JSON.parse(stored) : {
        userName: 'User',
        volume: 1,
        repeat: 'off',
        shuffle: false
      };
    } catch (error) {
      console.error('❌ Failed to load user preferences:', error);
      return {
        userName: 'User',
        volume: 1,
        repeat: 'off',
        shuffle: false
      };
    }
  }

  // Search History
  saveSearchHistory(history: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
      console.log('💾 Search history saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save search history:', error);
    }
  }

  getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load search history:', error);
      return [];
    }
  }

  addSearchQuery(query: string): void {
    const history = this.getSearchHistory();
    const filtered = history.filter(item => item !== query);
    filtered.unshift(query);
    const limited = filtered.slice(0, 50); // Keep only last 50 searches
    this.saveSearchHistory(limited);
  }

  // Last Played Track
  saveLastPlayedTrack(track: Track): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, JSON.stringify(track));
      console.log('💾 Last played track saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save last played track:', error);
    }
  }

  getLastPlayedTrack(): Track | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Failed to load last played track:', error);
      return null;
    }
  }

  // Listening Stats
  saveListeningStats(stats: StoredData['listeningStats']): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LISTENING_STATS, JSON.stringify(stats));
      console.log('💾 Listening stats saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save listening stats:', error);
    }
  }

  getListeningStats(): StoredData['listeningStats'] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LISTENING_STATS);
      return stored ? JSON.parse(stored) : {
        totalPlayTime: 0,
        tracksPlayed: 0,
        sessionsCount: 0,
        lastSession: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to load listening stats:', error);
      return {
        totalPlayTime: 0,
        tracksPlayed: 0,
        sessionsCount: 0,
        lastSession: new Date().toISOString()
      };
    }
  }

  updateListeningStats(playTime: number): void {
    const stats = this.getListeningStats();
    stats.totalPlayTime += playTime;
    stats.tracksPlayed += 1;
    stats.lastSession = new Date().toISOString();
    this.saveListeningStats(stats);
  }

  // Export/Import functionality
  exportAllData(): StoredData {
    return {
      recentlyPlayed: this.getRecentlyPlayed(),
      playlists: this.getPlaylists(),
      likedSongs: this.getLikedSongs(),
      userPreferences: this.getUserPreferences(),
      searchHistory: this.getSearchHistory(),
      lastPlayedTrack: this.getLastPlayedTrack() || undefined,
      listeningStats: this.getListeningStats()
    };
  }

  importAllData(data: StoredData): void {
    try {
      this.saveRecentlyPlayed(data.recentlyPlayed);
      this.savePlaylists(data.playlists);
      this.saveLikedSongs(data.likedSongs);
      this.saveUserPreferences(data.userPreferences);
      this.saveSearchHistory(data.searchHistory);
      if (data.lastPlayedTrack) {
        this.saveLastPlayedTrack(data.lastPlayedTrack);
      }
      this.saveListeningStats(data.listeningStats);
      console.log('✅ All data imported successfully');
    } catch (error) {
      console.error('❌ Failed to import data:', error);
    }
  }

  // Clear all data
  clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🗑️ All local data cleared');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  }

  // Get storage size
  getStorageSize(): string {
    try {
      let totalSize = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });
      
      if (totalSize < 1024) {
        return `${totalSize} bytes`;
      } else if (totalSize < 1024 * 1024) {
        return `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      }
    } catch (error) {
      console.error('❌ Failed to calculate storage size:', error);
      return 'Unknown';
    }
  }
}

export const localStorageService = new LocalStorageService();
