import { EventEmitter } from 'events';
import axios from 'axios';

export interface LavalinkTrack {
  encoded: string;
  info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    position: number;
    title: string;
    uri: string;
    artworkUrl?: string;
    isrc?: string;
  };
  pluginInfo?: any;
}

export interface LavalinkPlayerState {
  guildId: string;
  track?: LavalinkTrack;
  volume: number;
  paused: boolean;
  state: 'PLAYING' | 'PAUSED' | 'STOPPED' | 'ENDED';
  voice: {
    token: string;
    endpoint: string;
    sessionId: string;
  };
  filters?: any;
}

export class LavalinkService extends EventEmitter {
  private lavalinkUrl: string;
  private password: string;
  private sessionId: string | null = null;
  private connected: boolean = false;

  constructor(lavalinkUrl: string = 'ws://localhost:2333', password: string = 'youshallnotpass') {
    super();
    this.lavalinkUrl = lavalinkUrl;
    this.password = password;
  }

  /**
   * Connect to Lavalink server
   */
  public async connect(): Promise<void> {
    try {
      console.log('🔗 Connecting to Lavalink server...');
      
      // Test connection with REST API
      const response = await axios.get(`${this.lavalinkUrl.replace('ws://', 'http://')}/version`, {
        headers: {
          'Authorization': this.password
        }
      });

      console.log('✅ Connected to Lavalink:', response.data);
      this.connected = true;
      this.emit('connected');
    } catch (error) {
      console.error('❌ Failed to connect to Lavalink:', error);
      throw new Error('Lavalink connection failed');
    }
  }

  /**
   * Load a track from YouTube using youtube-source plugin
   */
  public async loadTrack(videoId: string): Promise<LavalinkTrack> {
    try {
      console.log('🎵 Loading YouTube track:', videoId);
      
      // Use youtube-source plugin REST route
      const response = await axios.get(
        `${this.lavalinkUrl.replace('ws://', 'http://')}/youtube/stream/${videoId}`,
        {
          headers: {
            'Authorization': this.password
          },
          responseType: 'stream'
        }
      );

      // For streaming, we need to get the track info first
      const trackInfo = await this.getTrackInfo(videoId);
      
      return {
        encoded: this.encodeTrack(videoId),
        info: {
          identifier: videoId,
          isSeekable: true,
          author: trackInfo.author || 'Unknown',
          length: trackInfo.duration || 0,
          isStream: false,
          position: 0,
          title: trackInfo.title || 'Unknown',
          uri: `https://www.youtube.com/watch?v=${videoId}`,
          artworkUrl: trackInfo.thumbnail
        }
      };
    } catch (error) {
      console.error('❌ Failed to load track:', error);
      throw new Error(`Failed to load YouTube track: ${videoId}`);
    }
  }

  /**
   * Get track info from YouTube
   */
  private async getTrackInfo(videoId: string): Promise<any> {
    try {
      // Use youtube-source to get track info
      const response = await axios.get(
        `${this.lavalinkUrl.replace('ws://', 'http://')}/loadtracks`,
        {
          headers: {
            'Authorization': this.password
          },
          params: {
            identifier: `https://www.youtube.com/watch?v=${videoId}`
          }
        }
      );

      const tracks = response.data.tracks;
      if (tracks && tracks.length > 0) {
        return tracks[0].info;
      }
      
      throw new Error('No track found');
    } catch (error) {
      // Fallback - return basic info
      return {
        title: `YouTube Video ${videoId}`,
        author: 'Unknown',
        duration: 0
      };
    }
  }

  /**
   * Encode track for Lavalink
   */
  private encodeTrack(videoId: string): string {
    // Simple base64 encoding of video ID for Lavalink
    return Buffer.from(videoId).toString('base64');
  }

  /**
   * Get streaming URL directly from youtube-source
   */
  public async getStreamingUrl(videoId: string): Promise<string> {
    try {
      console.log('🔗 Getting streaming URL from youtube-source:', videoId);
      
      // Use youtube-source plugin to get streaming URL
      const response = await axios.get(
        `${this.lavalinkUrl.replace('ws://', 'http://')}/youtube/stream/${videoId}`,
        {
          headers: {
            'Authorization': this.password
          },
          params: {
            withClient: 'ANDROID_VR' // Use ANDROID_VR client to avoid signature issues
          }
        }
      );

      // The response should contain the stream URL or redirect
      if (response.request?.res?.responseUrl) {
        console.log('✅ Got redirect URL:', response.request.res.responseUrl);
        return response.request.res.responseUrl;
      }
      
      // If no redirect, return the endpoint URL for streaming
      const streamUrl = `${this.lavalinkUrl.replace('ws://', 'http://')}/youtube/stream/${videoId}?withClient=WEB`;
      console.log('✅ Using endpoint stream URL:', streamUrl);
      return streamUrl;
      
    } catch (error: any) {
      console.error('❌ Failed to get streaming URL:', error);
      
      // Try fallback method - use the loadtracks endpoint to get track info
      try {
        console.log('🔄 Trying fallback streaming method...');
        const response = await axios.get(`${this.lavalinkUrl.replace('ws://', 'http://')}/v4/loadtracks`, {
          headers: {
            'Authorization': this.password
          },
          params: {
            identifier: `https://www.youtube.com/watch?v=${videoId}`
          }
        });

        if (response.data.tracks && response.data.tracks.length > 0) {
          const track = response.data.tracks[0];
          console.log('✅ Got track info, returning stream endpoint');
          return `${this.lavalinkUrl.replace('ws://', 'http://')}/youtube/stream/${videoId}`;
        } else {
          throw new Error('No track found');
        }
      } catch (fallbackError: any) {
        console.error('❌ Fallback streaming method also failed:', fallbackError);
        throw new Error(`Failed to get streaming URL for video: ${videoId}`);
      }
    }
  }

  /**
   * Search YouTube using youtube-source plugin
   */
  public async searchYouTube(query: string): Promise<any[]> {
    try {
      console.log(`🔍 Searching YouTube with youtube-source: ${query}`);
      
      // Use the standard Lavalink loadtracks endpoint with youtube search
      const response = await axios.get(`${this.lavalinkUrl.replace('ws://', 'http://')}/v4/loadtracks`, {
        headers: {
          'Authorization': this.password,
          'Content-Type': 'application/json'
        },
        params: {
          identifier: `ytsearch:${query}`
        }
      });

      console.log('🔍 Lavalink response:', response.data);
      console.log('🔍 Load type:', response.data.loadType);
      console.log('🔍 Data type:', typeof response.data.data);
      console.log('🔍 Data length:', response.data.data?.length);
      console.log('🔍 Full response structure:', JSON.stringify(response.data, null, 2));
      
      let tracks = [];
      if (response.data.loadType === 'search' && response.data.data) {
        tracks = response.data.data;
        console.log('✅ Found tracks in data field:', tracks.length);
      } else if (response.data.tracks) {
        tracks = response.data.tracks;
        console.log('✅ Found tracks in tracks field:', tracks.length);
      }
      
      console.log(`✅ YouTube search returned ${tracks.length} tracks`);
      
      if (tracks.length > 0) {
        console.log('🔍 First track structure:', JSON.stringify(tracks[0], null, 2));
      }
      
      return tracks.map((track: any) => {
        // Lavalink tracks have info object with the actual track data
        const trackInfo = track.info || {};
        console.log('🔍 Mapping track:', trackInfo);
        
        return {
          id: trackInfo.identifier || track.videoId || track.id,
          name: trackInfo.title || track.title || track.name,
          artists: [{ name: trackInfo.author || track.author || track.artist || 'Unknown' }],
          duration_ms: trackInfo.length || track.duration || track.length || 0,
          uri: `youtube:${trackInfo.identifier || track.videoId || track.id}`,
          album: {
            images: [{ url: trackInfo.artworkUrl || track.thumbnail || track.artworkUrl || '' }]
          }
        };
      });
    } catch (error: any) {
      console.error('❌ YouTube search failed:', error);
      
      // If we get a 400 error, it's likely YouTube bot detection
      if (error.response?.status === 400) {
        console.warn('⚠️ YouTube search blocked by bot detection (400 error)');
        console.warn('💡 Consider configuring OAuth or poToken for better access');
      }
      
      return [];
    }
  }

  /**
   * Configure youtube-source with OAuth or poToken
   */
  public async configureYouTubeSource(options: {
    oauth?: {
      enabled: boolean;
      refreshToken?: string;
      skipInitialization?: boolean;
    };
    poToken?: {
      token: string;
      visitorData: string;
    };
  }): Promise<void> {
    try {
      console.log('⚙️ Configuring youtube-source...');
      
      await axios.post(
        `${this.lavalinkUrl.replace('ws://', 'http://')}/youtube`,
        options,
        {
          headers: {
            'Authorization': this.password,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ YouTube source configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure YouTube source:', error);
      throw new Error('YouTube source configuration failed');
    }
  }

  /**
   * Check if Lavalink is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get connection status
   */
  public async getStatus(): Promise<any> {
    try {
      const response = await axios.get(`${this.lavalinkUrl.replace('ws://', 'http://')}/version`, {
        headers: {
          'Authorization': this.password
        }
      });
      
      return {
        connected: this.connected,
        version: response.data,
        plugins: ['youtube-source']
      };
    } catch (error) {
      return {
        connected: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Disconnect from Lavalink
   */
  public disconnect(): void {
    this.connected = false;
    this.sessionId = null;
    console.log('🔌 Disconnected from Lavalink');
    this.emit('disconnected');
  }
}
