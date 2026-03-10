import { Readable, Transform } from 'stream';
import { YouTubeService } from './youtube.js';
import { Track } from '@shared/types';

export class StreamService {
  private youtubeService: YouTubeService;
  private activeStreams: Map<string, Readable> = new Map();

  constructor() {
    this.youtubeService = new YouTubeService();
  }

  public async getAudioStream(track: Track): Promise<Readable> {
    // First, find the YouTube video for this track
    const artistName = track.artists[0]?.name || '';
    const trackTitle = track.name;
    
    const searchQuery = `${artistName} - ${trackTitle} audio`;
    const videos = await this.youtubeService.searchVideos(searchQuery, 5);
    
    const bestMatch = this.youtubeService.findBestMatch(videos, trackTitle, artistName);
    
    if (!bestMatch) {
      throw new Error(`No suitable YouTube video found for: ${artistName} - ${trackTitle}`);
    }

    // Get the audio stream
    const stream = this.youtubeService.getAudioStream(bestMatch.id);
    
    // Store the stream for cleanup
    this.activeStreams.set(track.id, stream);
    
    // Add cleanup when stream ends
    stream.on('end', () => {
      this.activeStreams.delete(track.id);
    });
    
    stream.on('error', () => {
      this.activeStreams.delete(track.id);
    });

    return stream;
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

  public async getStreamWithBuffer(track: Track, bufferSize: number = 1024 * 1024): Promise<Readable> {
    const rawStream = await this.getAudioStream(track);
    return this.createBufferedStream(rawStream, bufferSize);
  }

  public stopStream(trackId: string): void {
    const stream = this.activeStreams.get(trackId);
    if (stream) {
      stream.destroy();
      this.activeStreams.delete(trackId);
    }
  }

  public stopAllStreams(): void {
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
