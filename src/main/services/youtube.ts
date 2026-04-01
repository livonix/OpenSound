import { Readable } from 'stream';
import { YouTubeVideo, StreamInfo } from '../../shared/types';

export class YouTubeService {
  private audioUrlCache: Map<string, { url: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // YouTubeService deprecated - using Lavalink instead
  }

  public async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    // YouTubeService deprecated - using Lavalink instead
    throw new Error('YouTubeService.searchVideos is deprecated - use Lavalink instead');
  }

  public async getStreamInfo(videoId: string): Promise<StreamInfo> {
    // YouTubeService deprecated - using Lavalink instead
    throw new Error('YouTubeService.getStreamInfo is deprecated - use Lavalink instead');
  }

  public async getDirectAudioUrl(videoId: string): Promise<string> {
    // YouTubeService deprecated - using Lavalink instead
    throw new Error('YouTubeService.getDirectAudioUrl is deprecated - use Lavalink instead');
  }

  public getAudioStream(videoId: string): Readable {
    // YouTubeService deprecated - using Lavalink instead
    throw new Error('YouTubeService.getAudioStream is deprecated - use Lavalink instead');
  }

  public findBestMatch(videos: YouTubeVideo[], trackTitle: string, artistName: string): YouTubeVideo | null {
    // YouTubeService deprecated - using Lavalink instead
    return null;
  }

  public async testYtDlp(): Promise<boolean> {
    // YouTubeService deprecated - using Lavalink instead
    return false;
  }
}