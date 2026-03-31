import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';
import { Playlist, Track } from '../../shared/types';

export class PlaylistService {
  private playlistsPath: string;
  private playlists: Map<string, Playlist> = new Map();

  constructor() {
    this.playlistsPath = path.join(app.getPath('userData'), 'playlists');
    
    // Ensure playlists directory exists
    if (!fs.existsSync(this.playlistsPath)) {
      fs.mkdirSync(this.playlistsPath, { recursive: true });
    }
    
    // Load existing playlists
    this.loadPlaylistsFromDisk();
  }

  private loadPlaylistsFromDisk(): void {
    try {
      const files = fs.readdirSync(this.playlistsPath);
      console.log('📁 PlaylistService: Found', files.length, 'files in playlists directory');
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.playlistsPath, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const playlist: Playlist = JSON.parse(data);
          
          // Convert date strings back to Date objects
          playlist.createdAt = new Date(playlist.createdAt);
          playlist.updatedAt = new Date(playlist.updatedAt);
          
          this.playlists.set(playlist.id, playlist);
          console.log('📝 PlaylistService: Loaded playlist:', playlist.name, 'with', playlist.tracks.length, 'tracks');
        }
      }
      
      console.log('📝 PlaylistService: Total playlists loaded:', this.playlists.size);
    } catch (error) {
      console.error('❌ PlaylistService: Failed to load playlists from disk:', error);
    }
  }

  private savePlaylistToDisk(playlist: Playlist): void {
    try {
      const filePath = path.join(this.playlistsPath, `${playlist.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(playlist, null, 2));
    } catch (error) {
      console.error('Failed to save playlist:', error);
      throw error;
    }
  }

  public async createPlaylist(name: string, description?: string): Promise<Playlist> {
    const playlist: Playlist = {
      id: uuidv4(),
      name,
      description,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.playlists.set(playlist.id, playlist);
    this.savePlaylistToDisk(playlist);

    return playlist;
  }

  public async updatePlaylist(id: string, updates: { name?: string; description?: string }): Promise<Playlist> {
    const playlist = this.playlists.get(id);
    
    if (!playlist) {
      throw new Error(`Playlist with id ${id} not found`);
    }

    if (updates.name !== undefined) {
      playlist.name = updates.name;
    }
    
    if (updates.description !== undefined) {
      playlist.description = updates.description;
    }

    playlist.updatedAt = new Date();
    
    this.playlists.set(id, playlist);
    this.savePlaylistToDisk(playlist);

    return playlist;
  }

  public async deletePlaylist(id: string): Promise<void> {
    const playlist = this.playlists.get(id);
    
    if (!playlist) {
      throw new Error(`Playlist with id ${id} not found`);
    }

    this.playlists.delete(id);

    // Remove from disk
    try {
      const filePath = path.join(this.playlistsPath, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete playlist file:', error);
      throw error;
    }
  }

  public async addTrackToPlaylist(playlistId: string, track: Track): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    
    if (!playlist) {
      throw new Error(`Playlist with id ${playlistId} not found`);
    }

    // Check if track already exists
    const existingTrackIndex = playlist.tracks.findIndex(t => t.id === track.id);
    
    if (existingTrackIndex === -1) {
      playlist.tracks.push(track);
      playlist.updatedAt = new Date();
      
      this.playlists.set(playlistId, playlist);
      this.savePlaylistToDisk(playlist);
    }
  }

  public async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    
    if (!playlist) {
      throw new Error(`Playlist with id ${playlistId} not found`);
    }

    const trackIndex = playlist.tracks.findIndex(t => t.id === trackId);
    
    if (trackIndex !== -1) {
      playlist.tracks.splice(trackIndex, 1);
      playlist.updatedAt = new Date();
      
      this.playlists.set(playlistId, playlist);
      this.savePlaylistToDisk(playlist);
    }
  }

  public async reorderPlaylistTracks(playlistId: string, fromIndex: number, toIndex: number): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    
    if (!playlist) {
      throw new Error(`Playlist with id ${playlistId} not found`);
    }

    if (fromIndex < 0 || fromIndex >= playlist.tracks.length ||
        toIndex < 0 || toIndex >= playlist.tracks.length) {
      throw new Error('Invalid track indices');
    }

    const [movedTrack] = playlist.tracks.splice(fromIndex, 1);
    playlist.tracks.splice(toIndex, 0, movedTrack);
    playlist.updatedAt = new Date();
    
    this.playlists.set(playlistId, playlist);
    this.savePlaylistToDisk(playlist);
  }

  public getPlaylist(id: string): Playlist | null {
    return this.playlists.get(id) || null;
  }

  public async getAllPlaylists(): Promise<Playlist[]> {
    const playlists = Array.from(this.playlists.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    console.log('📝 PlaylistService: getAllPlaylists() returning', playlists.length, 'playlists');
    console.log('📝 PlaylistService: playlists:', playlists.map(p => ({ id: p.id, name: p.name, tracks: p.tracks.length })));
    
    return playlists;
  }

  public async searchPlaylists(query: string): Promise<Playlist[]> {
    const searchTerm = query.toLowerCase();
    const allPlaylists = await this.getAllPlaylists();
    
    return allPlaylists.filter((playlist: Playlist) => 
      playlist.name.toLowerCase().includes(searchTerm) ||
      (playlist.description && playlist.description.toLowerCase().includes(searchTerm))
    );
  }

  public getPlaylistCount(): number {
    return this.playlists.size;
  }

  public getPlaylistDuration(playlistId: string): number {
    const playlist = this.playlists.get(playlistId);
    
    if (!playlist) {
      return 0;
    }

    return playlist.tracks.reduce((total, track) => total + track.duration_ms, 0);
  }

  public getPlaylistTrackCount(playlistId: string): number {
    const playlist = this.playlists.get(playlistId);
    return playlist ? playlist.tracks.length : 0;
  }

  public async duplicatePlaylist(id: string, newName?: string): Promise<Playlist> {
    const originalPlaylist = this.playlists.get(id);
    
    if (!originalPlaylist) {
      throw new Error(`Playlist with id ${id} not found`);
    }

    const newPlaylist: Playlist = {
      id: uuidv4(),
      name: newName || `${originalPlaylist.name} (Copy)`,
      description: originalPlaylist.description,
      tracks: [...originalPlaylist.tracks],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.playlists.set(newPlaylist.id, newPlaylist);
    this.savePlaylistToDisk(newPlaylist);

    return newPlaylist;
  }

  public async exportPlaylist(id: string, format: 'json' | 'm3u' = 'json'): Promise<string> {
    const playlist = this.playlists.get(id);
    
    if (!playlist) {
      throw new Error(`Playlist with id ${id} not found`);
    }

    if (format === 'json') {
      return JSON.stringify(playlist, null, 2);
    } else if (format === 'm3u') {
      let m3uContent = '#EXTM3U\n';
      m3uContent += `#PLAYLIST:${playlist.name}\n`;
      
      if (playlist.description) {
        m3uContent += `#EXTDESC:${playlist.description}\n`;
      }
      
      for (const track of playlist.tracks) {
        const duration = Math.floor(track.duration_ms / 1000);
        const artist = track.artists.map(a => a.name).join(', ');
        m3uContent += `#EXTINF:${duration},${artist} - ${track.name}\n`;
        m3uContent += `${track.external_urls.spotify}\n`;
      }
      
      return m3uContent;
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  public async importPlaylist(content: string, format: 'json' | 'm3u' = 'json'): Promise<Playlist> {
    if (format === 'json') {
      try {
        const playlistData = JSON.parse(content);
        const playlist: Playlist = {
          ...playlistData,
          id: uuidv4(), // Generate new ID
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.playlists.set(playlist.id, playlist);
        this.savePlaylistToDisk(playlist);

        return playlist;
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    } else {
      throw new Error('M3U import not yet implemented');
    }
  }
}
