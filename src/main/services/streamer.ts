import { Readable, Transform } from 'stream';
import { YouTubeStreamingService } from './youtubeStreaming';
import { Track } from '../../shared/types';
import axios from 'axios';

export class StreamService {
  private youtubeService: YouTubeStreamingService;
  private activeStreams: Map<string, Readable> = new Map();

  constructor() {
    this.youtubeService = new YouTubeStreamingService();
  }

  public async getFastAudioStream(track: Track): Promise<Readable> {
    try {
      console.log(`Getting audio stream for track: ${track.name}`);
      
      // Extract video ID from track URI
      const videoId = track.uri.replace('youtube:', '');
      
      // Get streaming URL from YouTube service
      const streamInfo = await this.youtubeService.getStreamUrl(`youtube_${videoId}`);
      
      console.log(`Streaming URL obtained: ${streamInfo.streamUrl.substring(0, 50)}...`);
      
      // Stream directly from the YouTube URL
      const response = await axios({
        method: 'GET',
        url: streamInfo.streamUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Referer': 'https://www.youtube.com/'
        },
        timeout: 30000 // 30 seconds timeout
      });

      const stream = response.data;
      
      // Store the stream for cleanup
      this.activeStreams.set(track.id, stream);
      
      // Add cleanup when stream ends
      stream.on('end', () => {
        console.log(`Stream ended for track: ${track.name}`);
        this.activeStreams.delete(track.id);
      });
      
      stream.on('error', (error: any) => {
        console.error(`Stream error for track: ${track.name}`, error);
        this.activeStreams.delete(track.id);
      });

      return stream;
    } catch (error: any) {
      console.error(`Failed to get audio stream for track: ${track.name}`, error);
      throw new Error(`Failed to get audio stream: ${error.message}`);
    }
  }

  public async getAudioStream(track: Track): Promise<Readable> {
    // Use the same implementation as fast stream
    return this.getFastAudioStream(track);
  }

  public createBufferedStream(sourceStream: Readable, bufferSize: number = 1024 * 1024): Readable {
    let buffer: Buffer[] = [];
    let totalBufferSize = 0;
    let isReading = true;
    let isEnded = false;

    const bufferedStream = new Readable({
      read() {
        isReading = true;
        pushBufferedData();
      }
    });

    function pushBufferedData() {
      if (!isReading || buffer.length === 0) {
        if (isEnded && buffer.length === 0) {
          bufferedStream.push(null);
        }
        return;
      }

      while (buffer.length > 0 && isReading) {
        const chunk = buffer.shift()!;
        const pushed = bufferedStream.push(chunk);
        
        if (!pushed) {
          buffer.unshift(chunk);
          isReading = false;
          break;
        }
      }
    }

    sourceStream.on('data', (chunk: Buffer) => {
      buffer.push(chunk);
      totalBufferSize += chunk.length;

      // Prevent buffer from growing too large
      while (totalBufferSize > bufferSize && buffer.length > 1) {
        const removed = buffer.shift()!;
        totalBufferSize -= removed.length;
      }

      pushBufferedData();
    });

    sourceStream.on('end', () => {
      isEnded = true;
      pushBufferedData();
    });

    sourceStream.on('error', (error) => {
      bufferedStream.emit('error', error);
    });

    return bufferedStream;
  }

  public async getStreamWithFastBuffer(track: Track, bufferSize: number = 1024 * 1024): Promise<Readable> {
    const fastStream = await this.getFastAudioStream(track);
    return this.createBufferedStream(fastStream, bufferSize);
  }

  public async getStreamWithBuffer(track: Track, bufferSize: number = 1024 * 1024): Promise<Readable> {
    const rawStream = await this.getAudioStream(track);
    return this.createBufferedStream(rawStream, bufferSize);
  }

  public stopStream(trackId: string): void {
    const stream = this.activeStreams.get(trackId);
    if (stream) {
      console.log(`Stopping stream for track: ${trackId}`);
      stream.destroy();
      this.activeStreams.delete(trackId);
    }
  }

  public stopAllStreams(): void {
    console.log(`Stopping all streams (${this.activeStreams.size} active)`);
    for (const [trackId, stream] of this.activeStreams) {
      stream.destroy();
    }
    this.activeStreams.clear();
  }

  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  public async testStream(track: Track): Promise<boolean> {
    try {
      const stream = await this.getAudioStream(track);
      
      return new Promise((resolve) => {
        let hasData = false;
        
        const timeout = setTimeout(() => {
          if (!hasData) {
            stream.destroy();
            resolve(false);
          }
        }, 5000); // 5 second timeout

        stream.on('data', () => {
          hasData = true;
          clearTimeout(timeout);
          stream.destroy();
          resolve(true);
        });

        stream.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        stream.on('end', () => {
          clearTimeout(timeout);
          resolve(hasData);
        });
      });
    } catch {
      return false;
    }
  }
}
