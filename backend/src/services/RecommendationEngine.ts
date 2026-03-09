import axios from 'axios';

export interface UserPreferences {
  userId: string;
  favoriteGenres: string[];
  favoriteArtists: string[];
  skipHistory: string[]; // videoIds skipped
  playHistory: string[]; // videoIds played
  searchHistory: string[]; // search queries
  skipPatterns: {
    [videoId: string]: {
      skipPosition: number; // position when skipped
      skipTime: number; // timestamp of skip
    };
  };
}

export interface Track {
  title: string;
  author: string;
  duration: number;
  identifier: string;
  uri: string;
  artworkUrl?: string;
  encoded: string;
}

export class RecommendationEngine {
  private preferences: Map<string, UserPreferences> = new Map();
  
  constructor() {
    this.loadPreferences();
  }

  // Track user interactions
  trackPlay(userId: string, track: Track): void {
    const prefs = this.getOrCreatePreferences(userId);
    prefs.playHistory.push(track.identifier);
    this.savePreferences(userId);
  }

  trackSkip(userId: string, track: Track, skipPosition: number): void {
    const prefs = this.getOrCreatePreferences(userId);
    prefs.skipHistory.push(track.identifier);
    prefs.skipPatterns[track.identifier] = {
      skipPosition,
      skipTime: Date.now()
    };
    this.savePreferences(userId);
  }

  trackSearch(userId: string, query: string): void {
    const prefs = this.getOrCreatePreferences(userId);
    prefs.searchHistory.push(query);
    
    // Extract potential genres/artists from search
    const extractedTerms = this.extractMusicTerms(query);
    extractedTerms.forEach(term => {
      if (this.isLikelyGenre(term)) {
        if (!prefs.favoriteGenres.includes(term)) {
          prefs.favoriteGenres.push(term);
        }
      } else if (this.isLikelyArtist(term)) {
        if (!prefs.favoriteArtists.includes(term)) {
          prefs.favoriteArtists.push(term);
        }
      }
    });
    
    this.savePreferences(userId);
  }

  // Get next recommendation based on current track and user preferences
  async getNextRecommendation(
    userId: string, 
    currentTrack: Track,
    skipPosition?: number
  ): Promise<Track | null> {
    const prefs = this.getOrCreatePreferences(userId);
    
    // Update skip position if provided
    if (skipPosition !== undefined) {
      this.trackSkip(userId, currentTrack, skipPosition);
    }

    // Build search query based on preferences
    const searchQueries = await this.buildRecommendationQueries(currentTrack, prefs);
    
    // Try each query until we find a good match
    for (const query of searchQueries) {
      try {
        const recommendations = await this.searchTracks(query);
        const filtered = this.filterRecommendations(recommendations, prefs, currentTrack);
        
        if (filtered.length > 0) {
          // Return the best recommendation
          return this.selectBestRecommendation(filtered, prefs);
        }
      } catch (error) {
        console.error(`Recommendation search failed for query: ${query}`, error);
      }
    }

    return null;
  }

  private async buildRecommendationQueries(currentTrack: Track, prefs: UserPreferences): Promise<string[]> {
    const queries: string[] = [];
    const artist = currentTrack.author;
    const title = currentTrack.title;

    // 1. Similar genre based on title/artist (HIGH PRIORITY - different artists)
    const genreTerms = this.extractGenreTerms(title, artist);
    if (genreTerms.length > 0) {
      queries.push(genreTerms.join(' '));
    }

    // 2. User's favorite genres (different artists)
    prefs.favoriteGenres.forEach(genre => {
      queries.push(genre);
    });

    // 3. User's favorite artists (except current artist)
    prefs.favoriteArtists.forEach(favArtist => {
      if (favArtist !== artist) { // Avoid duplicate of current artist
        queries.push(favArtist);
      }
    });

    // 4. Similar artists using Last.fm (if available)
    // Last.fm integration removed - using genre-based recommendations instead

    // 5. Title-based recommendations (different artists)
    const titleKeywords = this.extractTitleKeywords(title);
    if (titleKeywords.length > 0) {
      queries.push(titleKeywords.join(' '));
    }

    // 6. Mix of genre with popular terms
    if (genreTerms.length > 0) {
      queries.push(`${genreTerms[0]} 2024`);
      queries.push(`${genreTerms[0]} mix`);
      queries.push(`best ${genreTerms[0]} songs`);
    }

    // 7. Same artist as LAST resort (low priority)
    queries.push(artist);

    return queries;
  }

  private async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await axios.get(
        `http://localhost:2333/v4/loadtracks`,
        {
          params: {
            identifier: `ytsearch:${query}`
          },
          headers: {
            'Authorization': 'youshallnotpass'
          }
        }
      );

      if (!response.data?.data) return [];

      return response.data.data.map((track: any) => ({
        title: track.info?.title || 'Unknown',
        author: track.info?.author || 'Unknown',
        duration: track.info?.length || 0,
        identifier: track.info?.identifier || '',
        uri: track.info?.uri || '',
        artworkUrl: track.info?.artworkUrl || '',
        encoded: track.encoded
      }));
    } catch (error) {
      console.error('Search tracks error:', error);
      return [];
    }
  }

  private filterRecommendations(
    tracks: Track[], 
    prefs: UserPreferences, 
    currentTrack: Track
  ): Track[] {
    return tracks.filter(track => {
      // Skip if it's the current track
      if (track.identifier === currentTrack.identifier) return false;
      
      // Skip if same artist (to avoid recommending same artist)
      if (track.author.toLowerCase() === currentTrack.author.toLowerCase()) return false;
      
      // Skip if user has skipped this track recently
      if (prefs.skipHistory.includes(track.identifier)) {
        const skipPattern = prefs.skipPatterns[track.identifier];
        if (skipPattern && (Date.now() - skipPattern.skipTime) < 24 * 60 * 60 * 1000) { // 24 hours
          return false;
        }
      }
      
      // Skip if user has played this track recently
      if (prefs.playHistory.includes(track.identifier)) {
        return false;
      }
      
      // Prioritize tracks with user's favorite artists/genres
      return true;
    });
  }

  private selectBestRecommendation(tracks: Track[], prefs: UserPreferences): Track {
    // Score each track based on user preferences
    const scoredTracks = tracks.map(track => {
      let score = 0;
      
      // Bonus for favorite artist
      if (prefs.favoriteArtists.includes(track.author)) {
        score += 10;
      }
      
      // Bonus for favorite genre in title
      const genreBonus = prefs.favoriteGenres.reduce((bonus, genre) => {
        if (track.title.toLowerCase().includes(genre.toLowerCase()) ||
            track.author.toLowerCase().includes(genre.toLowerCase())) {
          return bonus + 5;
        }
        return bonus;
      }, 0);
      score += genreBonus;
      
      // Bonus for recent search terms
      const searchBonus = prefs.searchHistory.reduce((bonus, search) => {
        if (track.title.toLowerCase().includes(search.toLowerCase()) ||
            track.author.toLowerCase().includes(search.toLowerCase())) {
          return bonus + 3;
        }
        return bonus;
      }, 0);
      score += searchBonus;
      
      return { track, score };
    });
    
    // Sort by score and return the best
    scoredTracks.sort((a, b) => b.score - a.score);
    return scoredTracks[0].track;
  }

  private extractMusicTerms(query: string): string[] {
    // Simple extraction of potential music terms
    const terms = query.toLowerCase().split(/\s+/);
    return terms.filter(term => term.length > 2);
  }

  private isLikelyGenre(term: string): boolean {
    const commonGenres = [
      'pop', 'rock', 'hip', 'hop', 'rap', 'jazz', 'blues', 'classical',
      'electronic', 'edm', 'house', 'techno', 'trance', 'dubstep',
      'country', 'folk', 'indie', 'alternative', 'metal', 'punk',
      'r&b', 'soul', 'funk', 'reggae', 'latin', 'k-pop', 'afro',
      // French genres
      'rap', 'francophone', 'zouk', 'dancehall', 'afrobeat', 'trap'
    ];
    return commonGenres.includes(term.toLowerCase());
  }

  private isLikelyArtist(term: string): boolean {
    // Simple heuristic: if it's not a genre and has more than 2 characters
    return term.length > 2 && !this.isLikelyGenre(term);
  }

  private extractGenreTerms(title: string, artist: string): string[] {
    const combined = `${title} ${artist}`.toLowerCase();
    const terms: string[] = [];
    
    // Look for common genre indicators
    const genrePatterns = [
      'remix', 'mix', 'edit', 'version', 'cover', 'acoustic',
      'live', 'studio', 'unplugged', 'instrumental'
    ];
    
    genrePatterns.forEach(pattern => {
      if (combined.includes(pattern)) {
        terms.push(pattern);
      }
    });
    
    // Add genre detection based on common French rap terms
    if (combined.includes('rap') || combined.includes('hip') || combined.includes('trap')) {
      terms.push('rap');
    }
    if (combined.includes('francophone') || combined.includes('fr')) {
      terms.push('francophone');
    }
    
    // Special case: if it's a known French artist, assume rap/hip-hop
    const frenchRapArtists = ['gims', 'booba', 'ninho', 'sch', 'jul', 'damso', 'vald', 'kaaris', 'mhd', 'lomepal', 'oolking', 'rambo goyard', 'naps', 'alkapa', 'leka', 'soso maness'];
    if (frenchRapArtists.some(frenchArtist => combined.includes(frenchArtist))) {
      terms.push('rap');
      terms.push('francophone');
    }
    
    return terms;
  }

  private extractTitleKeywords(title: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return words.slice(0, 3); // Return top 3 keywords
  }

  private getOrCreatePreferences(userId: string): UserPreferences {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, {
        userId,
        favoriteGenres: [],
        favoriteArtists: [],
        skipHistory: [],
        playHistory: [],
        searchHistory: [],
        skipPatterns: {}
      });
    }
    return this.preferences.get(userId)!;
  }

  private savePreferences(userId: string): void {
    const prefs = this.preferences.get(userId);
    if (prefs) {
      // Keep only last 100 items in each history to prevent memory bloat
      prefs.playHistory = prefs.playHistory.slice(-100);
      prefs.skipHistory = prefs.skipHistory.slice(-100);
      prefs.searchHistory = prefs.searchHistory.slice(-50);
      
      // Clean old skip patterns (older than 7 days)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      Object.keys(prefs.skipPatterns).forEach(videoId => {
        if (prefs.skipPatterns[videoId].skipTime < weekAgo) {
          delete prefs.skipPatterns[videoId];
        }
      });
    }
  }

  private loadPreferences(): void {
    // In a real app, you'd load from database
    // For now, we'll use in-memory storage
    console.log('🎵 Recommendation engine initialized');
  }

  // Get user statistics for debugging/analytics
  getUserStats(userId: string): any {
    const prefs = this.preferences.get(userId);
    if (!prefs) return null;
    
    return {
      totalPlays: prefs.playHistory.length,
      totalSkips: prefs.skipHistory.length,
      favoriteGenres: prefs.favoriteGenres,
      favoriteArtists: prefs.favoriteArtists,
      recentSearches: prefs.searchHistory.slice(-5)
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
