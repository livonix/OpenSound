import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppConfig } from '../../shared/types';

export class ConfigService {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): AppConfig {
    return {
      spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || ''
      },
      youtube: {
        apiKey: process.env.YOUTUBE_API_KEY
      },
      lavalink: {
        host: process.env.LAVALINK_HOST || 'localhost',
        port: parseInt(process.env.LAVALINK_PORT || '2333', 10),
        password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
        secure: (process.env.LAVALINK_SECURE || 'false').toLowerCase() === 'true'
      },
      cache: {
        maxSize: 100 * 1024 * 1024, // 100MB
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      }
    };
  }

  public async initialize(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const loadedConfig = JSON.parse(configData);
        this.config = { ...this.getDefaultConfig(), ...loadedConfig };
      } else {
        await this.saveConfig();
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  public async saveConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    return this.saveConfig();
  }

  public getSpotifyCredentials(): { clientId: string; clientSecret: string } {
    return this.config.spotify;
  }

  public updateSpotifyCredentials(clientId: string, clientSecret: string): Promise<void> {
    return this.updateConfig({
      spotify: { clientId, clientSecret }
    });
  }

  public getYouTubeApiKey(): string | undefined {
    return this.config.youtube.apiKey;
  }

  public updateYouTubeApiKey(apiKey: string): Promise<void> {
    return this.updateConfig({
      youtube: { apiKey }
    });
  }

  public getCacheConfig(): { maxSize: number; ttl: number } {
    return this.config.cache;
  }
}
