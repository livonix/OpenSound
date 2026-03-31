import { EventEmitter } from 'events';
import { Track, LikedSongs } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class LikedSongsService extends EventEmitter {
  private likedSongs: LikedSongs = {
    id: 'liked-songs',
    name: 'Liked Songs',
    tracks: [],
    updatedAt: new Date()
  };
  private filePath: string;

  constructor() {
    super();
    this.filePath = path.join(app.getPath('userData'), 'liked-songs.json');
    this.loadLikedSongs();
  }

  private loadLikedSongs(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.likedSongs = JSON.parse(data);
      } else {
        this.likedSongs = {
          id: 'liked-songs',
          name: 'Liked Songs',
          tracks: [],
          updatedAt: new Date()
        };
        this.saveLikedSongs();
      }
    } catch (error) {
      console.error('Failed to load liked songs:', error);
      this.likedSongs = {
        id: 'liked-songs',
        name: 'Liked Songs',
        tracks: [],
        updatedAt: new Date()
      };
    }
  }

  private saveLikedSongs(): void {
    try {
      this.likedSongs.updatedAt = new Date();
      fs.writeFileSync(this.filePath, JSON.stringify(this.likedSongs, null, 2));
      this.emit('liked-songs-updated', this.likedSongs);
    } catch (error) {
      console.error('Failed to save liked songs:', error);
    }
  }

  public getLikedSongs(): LikedSongs {
    console.log(`📝 Getting liked songs: ${this.likedSongs.tracks.length} tracks`);
    return this.likedSongs;
  }

  public isTrackLiked(trackId: string): boolean {
    return this.likedSongs.tracks.some(track => track.id === trackId);
  }

  public likeTrack(track: Track): void {
    if (!this.isTrackLiked(track.id)) {
      const likedTrack = { ...track, liked: true };
      this.likedSongs.tracks.push(likedTrack);
      this.saveLikedSongs();
      console.log(`✅ Track liked: ${track.name} by ${track.artists[0]?.name}`);
      console.log(`📝 Total liked songs: ${this.likedSongs.tracks.length}`);
    }
  }

  public unlikeTrack(trackId: string): void {
    const index = this.likedSongs.tracks.findIndex(track => track.id === trackId);
    if (index !== -1) {
      const track = this.likedSongs.tracks[index];
      this.likedSongs.tracks.splice(index, 1);
      this.saveLikedSongs();
      console.log(`❌ Track unliked: ${track.name} by ${track.artists[0]?.name}`);
      console.log(`📝 Total liked songs: ${this.likedSongs.tracks.length}`);
    }
  }

  public toggleLikeTrack(track: Track): boolean {
    if (this.isTrackLiked(track.id)) {
      this.unlikeTrack(track.id);
      return false;
    } else {
      this.likeTrack(track);
      return true;
    }
  }

  public getLikedTracksCount(): number {
    return this.likedSongs.tracks.length;
  }

  public addLikedPropertyToTracks(tracks: Track[]): Track[] {
    return tracks.map(track => ({
      ...track,
      liked: this.isTrackLiked(track.id)
    }));
  }

  public getLikedTrackWithUpdatedStatus(track: Track): Track {
    return {
      ...track,
      liked: this.isTrackLiked(track.id)
    };
  }
}
