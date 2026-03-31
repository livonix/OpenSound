import { Artist } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export class FollowedArtistsService {
  private dataPath: string;
  private artists: Artist[];

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'followed-artists.json');
    this.artists = [];
    this.loadArtists();
  }

  private loadArtists(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        const parsed = JSON.parse(data);
        this.artists = parsed.artists || [];
        console.log(`🎵 Loaded ${this.artists.length} followed artists`);
      } else {
        this.artists = [];
        this.saveArtists();
      }
    } catch (error) {
      console.error('❌ Failed to load followed artists:', error);
      this.artists = [];
    }
  }

  private saveArtists(): void {
    try {
      const data = {
        artists: this.artists,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved ${this.artists.length} followed artists`);
    } catch (error) {
      console.error('❌ Failed to save followed artists:', error);
    }
  }

  public getFollowedArtists(): Artist[] {
    return this.artists;
  }

  public isFollowing(artistId: string): boolean {
    return this.artists.some(artist => artist.id === artistId);
  }

  public followArtist(artist: Artist): void {
    if (!this.isFollowing(artist.id)) {
      this.artists.push({ ...artist, followed: true });
      this.saveArtists();
      console.log(`✅ Started following artist: ${artist.name}`);
    }
  }

  public unfollowArtist(artistId: string): void {
    this.artists = this.artists.filter(artist => artist.id !== artistId);
    this.saveArtists();
    console.log(`❌ Unfollowed artist: ${artistId}`);
  }

  public toggleFollowArtist(artist: Artist): boolean {
    if (this.isFollowing(artist.id)) {
      this.unfollowArtist(artist.id);
      return false;
    } else {
      this.followArtist(artist);
      return true;
    }
  }

  public getFollowedArtistsCount(): number {
    return this.artists.length;
  }

  public updateArtistInfo(updatedArtist: Artist): void {
    const index = this.artists.findIndex(artist => artist.id === updatedArtist.id);
    if (index !== -1) {
      this.artists[index] = { ...updatedArtist, followed: true };
      this.saveArtists();
      console.log(`🔄 Updated artist info: ${updatedArtist.name}`);
    }
  }
}

export const followedArtistsService = new FollowedArtistsService();
