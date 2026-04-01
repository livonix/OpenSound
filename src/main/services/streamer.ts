import { Readable } from 'stream';
import { Track } from '../../shared/types';

export class StreamService {
  private activeStreams: Map<string, Readable> = new Map();

  constructor() {
    // YouTube streaming now handled by Lavalink
  }

  public async getFastAudioStream(track: Track): Promise<Readable> {
    // YouTube streaming now handled by Lavalink - this service is deprecated
    throw new Error('StreamService.getFastAudioStream is deprecated - use Lavalink instead');
  }

  public async getAudioStream(track: Track): Promise<Readable> {
    // Use the same implementation as fast stream
    return this.getFastAudioStream(track);
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
}
