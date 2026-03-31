import { Client } from 'discord-rpc';
import { Track } from '../../shared/types';

export class DiscordRPCService {
  private client: Client | null = null;
  private clientId: string = '1488337584739319848';
  private isConnected: boolean = false;
  private currentTrack: Track | null = null;
  private startTime: number = Date.now();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('Initializing Discord RPC with client ID:', this.clientId);
      this.client = new Client({ transport: 'ipc' });
      
      this.client.on('ready', () => {
        console.log('✅ Discord RPC connected successfully');
        this.isConnected = true;
        this.updateActivity();
      });

      this.client.on('disconnected', () => {
        console.log('❌ Discord RPC disconnected');
        this.isConnected = false;
      });

      this.client.on('error', (error: any) => {
        console.error('Discord RPC error:', error);
      });

      await this.client.login({ clientId: this.clientId });
      console.log('🎮 Discord RPC login successful');
    } catch (error) {
      console.error('❌ Failed to initialize Discord RPC:', error);
      console.log('💡 Make sure Discord is running and the application is registered in Discord Developer Portal');
      // Silently fail - Discord RPC is optional
    }
  }

  public updateTrack(track: Track | null): void {
    console.log('🎵 Discord RPC updating track:', track?.name || 'none');
    this.currentTrack = track;
    this.startTime = Date.now();
    if (track) {
      this.updateActivity();
    } else {
      this.clearActivity();
    }
  }

  public updatePlayingState(isPlaying: boolean): void {
    if (!isPlaying) {
      this.clearActivity();
    } else {
      this.startTime = Date.now();
      this.updateActivity();
    }
  }

  private async updateActivity(): Promise<void> {
    if (!this.client || !this.isConnected || !this.currentTrack) {
      console.log('🔍 Discord RPC update skipped - client:', !!this.client, 'connected:', this.isConnected, 'track:', !!this.currentTrack);
      return;
    }

    try {
      // Get the album image URL if available
      const imageUrl = this.currentTrack.album?.images?.[0]?.url || null;
      
      const activity: any = {
        details: `🎵 ${this.currentTrack.name}`,
        state: `👤 ${this.currentTrack.artists.map(a => a.name).join(', ')}`,
        largeImageText: 'OpenSound - Music Streaming',
        smallImageKey: 'playing',
        smallImageText: 'Playing',
        startTimestamp: this.startTime,
        instance: false,
        buttons: [
          {
            label: 'View on GitHub',
            url: 'https://github.com/livonix/OpenSound'
          }
        ]
      };

      // Use the track's album image if available, otherwise use default music icon
      if (imageUrl) {
        activity.largeImageKey = imageUrl;
        console.log('🖼️ Using album image for Discord RPC:', imageUrl);
      } else {
        activity.largeImageKey = 'music';
        console.log('🎵 Using default music icon for Discord RPC');
      }

      await this.client.setActivity(activity);
      console.log('🎵 Discord RPC activity updated:', this.currentTrack.name);
    } catch (error) {
      console.error('❌ Failed to update Discord RPC activity:', error);
    }
  }

  private async clearActivity(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.clearActivity();
      console.log('Discord RPC activity cleared');
    } catch (error) {
      console.error('Failed to clear Discord RPC activity:', error);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
        console.log('Discord RPC disconnected');
      } catch (error) {
        console.error('Failed to disconnect Discord RPC:', error);
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  public isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  public testConnection(): void {
    console.log('🔍 Discord RPC Status Check:');
    console.log('- Client exists:', !!this.client);
    console.log('- Is connected:', this.isConnected);
    console.log('- Current track:', this.currentTrack?.name || 'none');
    console.log('- Discord running:', this.isReady());
  }
}
