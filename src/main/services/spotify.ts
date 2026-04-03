import axios, { AxiosInstance } from 'axios';
import { Track, Artist, Album, SearchResult } from '../../shared/types';

export class SpotifyService {
  private client: AxiosInstance = {} as AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string = '';
  private clientSecret: string = '';
  private demoMode: boolean = false;

  constructor(clientId: string, clientSecret: string) {
    console.log('SpotifyService constructor:', { clientId: !!clientId, clientSecret: !!clientSecret });
    
    if (!clientId || !clientSecret) {
      console.warn('Spotify not configured - running in demo mode');
      this.demoMode = true;
      return;
    }
    
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.demoMode = false;
    console.log('SpotifyService initialized in production mode');
    
    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
    });

    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    
    if (!this.accessToken || now >= this.tokenExpiry) {
      await this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      throw new Error('Spotify authentication failed');
    }
  }

  public async searchTracks(query: string, limit: number = 20, offset: number = 0): Promise<SearchResult> {
    console.log('searchTracks called:', { query, limit, offset, demoMode: this.demoMode });
    
    if (this.demoMode) {
      console.log('Returning demo search results');
      return this.getDemoSearchResults(query, limit);
    }
    
    await this.ensureValidToken();
    
    try {
      console.log('Making real Spotify API search request');
      const response = await this.client.get('/search', {
        params: {
          q: query,
          type: 'track,artist',
          limit,
          offset,
        },
      });

      console.log('Spotify API search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to search tracks:', error);
      throw new Error('Track search failed');
    }
  }

  public async getTrack(id: string): Promise<Track> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get(`/tracks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get track:', error);
      throw new Error('Failed to fetch track');
    }
  }

  public async getAlbum(id: string): Promise<Album> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get(`/albums/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get album:', error);
      throw new Error('Failed to fetch album');
    }
  }

  public async getArtist(id: string): Promise<Artist> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get(`/artists/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get artist:', error);
      throw new Error('Failed to fetch artist');
    }
  }

  public async getArtistAlbums(id: string, limit: number = 20): Promise<Album[]> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get(`/artists/${id}/albums`, {
        params: {
          limit,
          include_groups: 'album,single',
        },
      });

      return response.data.items;
    } catch (error) {
      console.error('Failed to get artist albums:', error);
      throw new Error('Failed to fetch artist albums');
    }
  }

  public async getAudioFeatures(trackIds: string | string[]): Promise<any> {
    await this.ensureValidToken();
    
    try {
      const ids = Array.isArray(trackIds) ? trackIds.join(',') : trackIds;
      const response = await this.client.get(`/audio-features/${ids}`);
      return Array.isArray(trackIds) ? response.data.audio_features : response.data;
    } catch (error) {
      console.error('Failed to get audio features:', error);
      throw new Error('Failed to fetch audio features');
    }
  }

  public async getTrackAnalysis(trackId: string): Promise<any> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get(`/audio-analysis/${trackId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get track analysis:', error);
      throw new Error('Failed to fetch track analysis');
    }
  }

  public async getRecommendations(options: {
    seed_tracks?: string[];
    seed_artists?: string[];
    seed_genres?: string[];
    limit?: number;
    target_energy?: number;
    target_danceability?: number;
    target_valence?: number;
    target_tempo?: number;
  }): Promise<any> {
    await this.ensureValidToken();
    
    try {
      const params: any = {
        limit: options.limit || 20,
      };

      if (options.seed_tracks) params.seed_tracks = options.seed_tracks.join(',');
      if (options.seed_artists) params.seed_artists = options.seed_artists.join(',');
      if (options.seed_genres) params.seed_genres = options.seed_genres.join(',');
      if (options.target_energy !== undefined) params.target_energy = options.target_energy;
      if (options.target_danceability !== undefined) params.target_danceability = options.target_danceability;
      if (options.target_valence !== undefined) params.target_valence = options.target_valence;
      if (options.target_tempo !== undefined) params.target_tempo = options.target_tempo;

      const response = await this.client.get('/recommendations', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw new Error('Failed to fetch recommendations');
    }
  }

  public async getAlbumTracks(id: string, limit: number = 50, offset: number = 0): Promise<Track[]> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get(`/albums/${id}/tracks`, {
        params: { limit, offset },
      });

      return response.data.items;
    } catch (error) {
      console.error('Failed to get album tracks:', error);
      throw new Error('Failed to fetch album tracks');
    }
  }

  public async getSeveralTracks(ids: string[]): Promise<Track[]> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get('/tracks', {
        params: {
          ids: ids.join(','),
        },
      });

      return response.data.tracks;
    } catch (error) {
      console.error('Failed to get several tracks:', error);
      throw new Error('Failed to fetch tracks');
    }
  }

  public isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  public updateCredentials(clientId: string, clientSecret: string): void {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  private getDemoSearchResults(query: string, limit: number): SearchResult {
    const demoTracks: Track[] = [
      {
        id: 'demo-track-1',
        name: `Demo Track 1 - "${query}"`,
        artists: [{ id: 'demo-artist-1', name: 'Demo Artist', external_urls: { spotify: '#' } }],
        album: {
          id: 'demo-album-1',
          name: 'Demo Album',
          artists: [{ id: 'demo-artist-1', name: 'Demo Artist', external_urls: { spotify: '#' } }],
          images: [{ url: '', height: 300, width: 300 }],
          external_urls: { spotify: '#' },
          release_date: '2024-01-01',
          total_tracks: 10
        },
        duration_ms: 180000,
        explicit: false,
        external_urls: { spotify: '#' },
        uri: ''
      },
      {
        id: 'demo-track-2',
        name: `Demo Track 2 - "${query}"`,
        artists: [{ id: 'demo-artist-2', name: 'Another Artist', external_urls: { spotify: '#' } }],
        album: {
          id: 'demo-album-2',
          name: 'Another Album',
          artists: [{ id: 'demo-artist-2', name: 'Another Artist', external_urls: { spotify: '#' } }],
          images: [{ url: '', height: 300, width: 300 }],
          external_urls: { spotify: '#' },
          release_date: '2024-01-01',
          total_tracks: 12
        },
        duration_ms: 200000,
        explicit: false,
        external_urls: { spotify: '#' },
        uri: ''
      }
    ];

    const demoArtists: Artist[] = [
      {
        id: 'demo-artist-1',
        name: 'Demo Artist',
        images: [
          { url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFFRDc2MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+REM8L3RleHQ+PC9zdmc+', height: 300, width: 300 }
        ],
        external_urls: { spotify: '#' },
        followers: 1000000,
        genres: ['Pop', 'Electronic'],
        popularity: 85
      },
      {
        id: 'demo-artist-2',
        name: 'Another Artist',
        images: [
          { url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCI+QU88L3RleHQ+PC9zdmc+', height: 300, width: 300 }
        ],
        external_urls: { spotify: '#' },
        followers: 500000,
        genres: ['Rock', 'Indie'],
        popularity: 75
      }
    ];

    return {
      tracks: {
        items: demoTracks.slice(0, limit),
        total: demoTracks.length,
        limit: limit,
        offset: 0
      },
      artists: {
        items: demoArtists,
        total: demoArtists.length,
        limit: 10,
        offset: 0
      }
    };
  }
}
