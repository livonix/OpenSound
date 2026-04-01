import { LavalinkService } from './lavalinkService';
import { StreamInfo } from '../../shared/types';

export class YouTubeLavalinkService {
  private lavalinkService: LavalinkService;
  private connected: boolean = false;

  constructor() {
    // Lavalink default configuration
    this.lavalinkService = new LavalinkService(
      'ws://localhost:2333',  // Default Lavalink WebSocket URL
      'youshallnotpass'       // Default Lavalink password
    );
    
    console.log('🎵 YouTube Lavalink service created (using youtube-source plugin)');
  }

  /**
   * Initialize connection to Lavalink
   */
  public async initialize(): Promise<void> {
    try {
      await this.lavalinkService.connect();
      this.connected = true;
      
      // Test if youtube-source plugin is available
      const status = await this.lavalinkService.getStatus();
      if (status.error) {
        throw new Error(`Lavalink connection error: ${status.error}`);
      }
      
      // Configure youtube-source with optimal settings
      await this.lavalinkService.configureYouTubeSource({
        oauth: {
          enabled: false // We'll enable this later if needed
        }
      });
      
      console.log('✅ YouTube Lavalink service initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize YouTube Lavalink service:', error);
      this.connected = false;
      
      // Provide helpful error message
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connection failed')) {
        throw new Error('Lavalink server is not running. Please start the Lavalink server on localhost:2333 with the youtube-source plugin.');
      }
      throw error;
    }
  }

  /**
   * Search for tracks on YouTube using youtube-source
   */
  public async searchTracks(query: string): Promise<any[]> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      console.log('🔍 Searching YouTube via Lavalink youtube-source:', query);
      
      const results = await this.lavalinkService.searchYouTube(query);
      
      console.log(`✅ Found ${results.length} tracks via youtube-source`);
      return results;
    } catch (error) {
      console.error('❌ YouTube search via Lavalink failed:', error);
      return [];
    }
  }

  /**
   * Get streaming URL using youtube-source plugin
   */
  public async getStreamUrl(videoId: string): Promise<StreamInfo> {
    if (!this.connected) {
      await this.initialize();
    }

    try {
      console.log(`🎬 Getting stream URL via youtube-source for: ${videoId}`);
      
      const streamUrl = await this.lavalinkService.getStreamingUrl(videoId);
      
      console.log('✅ youtube-source provided stream URL:', streamUrl.substring(0, 100) + '...');
      
      return {
        videoId,
        streamUrl,
        format: 'audio/mp4',
        bitrate: 128
      };
    } catch (error) {
      console.error('❌ youtube-source stream extraction failed:', error);
      throw new Error(`Failed to get stream URL for video: ${videoId}`);
    }
  }

  /**
   * Get connection status
   */
  public async getStatus(): Promise<any> {
    return await this.lavalinkService.getStatus();
  }

  /**
   * Check if service is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from Lavalink
   */
  public disconnect(): void {
    this.lavalinkService.disconnect();
    this.connected = false;
  }

  /**
   * Configure youtube-source with OAuth tokens
   */
  public async configureOAuth(refreshToken: string): Promise<void> {
    try {
      await this.lavalinkService.configureYouTubeSource({
        oauth: {
          enabled: true,
          refreshToken: refreshToken,
          skipInitialization: true
        }
      });
      
      console.log('✅ YouTube OAuth configured');
    } catch (error) {
      console.error('❌ Failed to configure YouTube OAuth:', error);
      throw error;
    }
  }

  /**
   * Configure youtube-source with poToken
   */
  public async configurePoToken(poToken: string, visitorData: string): Promise<void> {
    try {
      await this.lavalinkService.configureYouTubeSource({
        poToken: {
          token: poToken,
          visitorData: visitorData
        }
      });
      
      console.log('✅ YouTube poToken configured');
    } catch (error) {
      console.error('❌ Failed to configure YouTube poToken:', error);
      throw error;
    }
  }
}
