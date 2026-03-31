import { ipcMain, shell, app } from 'electron';
import { ConfigService } from '../services/config';
import { SpotifyService } from '../services/spotify';
import { YouTubeService } from '../services/youtube';
import { YouTubeStreamingService } from '../services/youtubeStreaming';
import { StreamService } from '../services/streamer';
import { CacheService } from '../services/cache';
import { PlaybackService } from '../services/playback';
import { PlaylistService } from '../services/playlist';
import { UpdaterService } from '../services/updater';
import { Track } from '../../shared/types';

let configService: ConfigService;
let spotifyService: SpotifyService;
let youtubeService: YouTubeService;
let youtubeStreamingService: YouTubeStreamingService;
let streamService: StreamService;
let cacheService: CacheService;
let playbackService: PlaybackService;
let playlistService: PlaylistService;
let updaterService: UpdaterService;

export function setupIpcHandlers(): void {
  // Initialize services
  configService = new ConfigService();
  const config = configService.getConfig();
  
  spotifyService = new SpotifyService(config.spotify.clientId, config.spotify.clientSecret);
  youtubeService = new YouTubeService();
  youtubeStreamingService = new YouTubeStreamingService();
  streamService = new StreamService();
  cacheService = new CacheService(config.cache);
  playbackService = new PlaybackService(streamService);
  playlistService = new PlaylistService();
  updaterService = new UpdaterService();

  // Test Discord RPC
  ipcMain.handle('discord:test', () => {
    const discordRPC = playbackService.getDiscordRPC();
    if (discordRPC && discordRPC.testConnection) {
      discordRPC.testConnection();
      return { success: true };
    }
    return { success: false, error: 'Discord RPC not available' };
  });

  // Spotify API handlers
  ipcMain.handle('spotify:search-tracks', async (_, query: string, limit: number = 20) => {
    try {
      return await spotifyService.searchTracks(query, limit);
    } catch (error) {
      console.error('Spotify search error:', error);
      throw error;
    }
  });

  ipcMain.handle('spotify:get-track', async (_, id: string) => {
    try {
      return await spotifyService.getTrack(id);
    } catch (error) {
      console.error('Spotify get track error:', error);
      throw error;
    }
  });

  ipcMain.handle('spotify:get-album', async (_, id: string) => {
    try {
      return await spotifyService.getAlbum(id);
    } catch (error) {
      console.error('Spotify get album error:', error);
      throw error;
    }
  });

  ipcMain.handle('spotify:get-artist', async (_, id: string) => {
    try {
      return await spotifyService.getArtist(id);
    } catch (error) {
      console.error('Spotify get artist error:', error);
      throw error;
    }
  });

  // YouTube streaming handlers
  ipcMain.handle('youtube:search', async (_, query: string) => {
    try {
      console.log('IPC: YouTube search called with query:', query);
      
      const tracks = await youtubeStreamingService.searchTracks(query);
      console.log('IPC: YouTube search returned', tracks.length, 'tracks');
      
      // Convert to renderer-friendly format
      const mappedTracks = tracks.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0]?.name || 'Unknown',
        duration: track.duration_ms,
        thumbnail: track.album.images[0]?.url || '',
        url: track.uri
      }));
      
      console.log('IPC: Mapped YouTube tracks:', mappedTracks.length);
      return mappedTracks;
    } catch (error) {
      console.error('YouTube search error:', error);
      throw error;
    }
  });

  ipcMain.handle('youtube:get-stream-info', async (_, videoId: string) => {
    try {
      return await youtubeService.getStreamInfo(videoId);
    } catch (error) {
      console.error('YouTube stream info error:', error);
      throw error;
    }
  });

  ipcMain.handle('youtube:get-stream-url', async (_, videoId: string) => {
    try {
      console.log('Getting YouTube stream URL for:', videoId);
      const streamInfo = await youtubeStreamingService.getStreamUrl(videoId);
      return streamInfo.streamUrl; // Return only the URL string
    } catch (error) {
      console.error('YouTube stream URL error:', error);
      throw error;
    }
  });

  // Playback handlers
  ipcMain.handle('playback:play', async (_, track) => {
    try {
      await playbackService.play(track);
      return { success: true };
    } catch (error) {
      console.error('Playback error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:pause', async () => {
    try {
      await playbackService.pause();
      return { success: true };
    } catch (error) {
      console.error('Pause error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:resume', async () => {
    try {
      await playbackService.resume();
      return { success: true };
    } catch (error) {
      console.error('Resume error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:set-volume', async (_, volume: number) => {
    try {
      playbackService.setVolume(volume);
      return { success: true };
    } catch (error) {
      console.error('Volume error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:seek', async (_, position: number) => {
    try {
      await playbackService.seek(position);
      return { success: true };
    } catch (error) {
      console.error('Seek error:', error);
      throw error;
    }
  });

  // Playlist handlers
  ipcMain.handle('playlist:create', async (_, name: string, description?: string) => {
    try {
      return await playlistService.createPlaylist(name, description);
    } catch (error) {
      console.error('Create playlist error:', error);
      throw error;
    }
  });

  ipcMain.handle('playlist:add-track', async (_, playlistId: string, track: Track) => {
    try {
      await playlistService.addTrackToPlaylist(playlistId, track);
      return { success: true };
    } catch (error) {
      console.error('Add track to playlist error:', error);
      throw error;
    }
  });

  ipcMain.handle('playlist:remove-track', async (_, playlistId: string, trackId: string) => {
    try {
      await playlistService.removeTrackFromPlaylist(playlistId, trackId);
      return { success: true };
    } catch (error) {
      console.error('Remove track from playlist error:', error);
      throw error;
    }
  });

  ipcMain.handle('playlist:get-all', async () => {
    try {
      return await playlistService.getAllPlaylists();
    } catch (error) {
      console.error('Get playlists error:', error);
      throw error;
    }
  });

  // Cache handlers
  ipcMain.handle('cache:clear', async () => {
    try {
      await cacheService.clear();
      return { success: true };
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  });

  ipcMain.handle('cache:get-size', async () => {
    try {
      return await cacheService.getSize();
    } catch (error) {
      console.error('Get cache size error:', error);
      throw error;
    }
  });

  // App handlers
  ipcMain.handle('app:open-external', async (_, url: string) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Open external error:', error);
      throw error;
    }
  });

  ipcMain.handle('app:get-version', async () => {
    return app.getVersion();
  });

  // Config handlers
  ipcMain.handle('config:get', async () => {
    try {
      return configService.getConfig();
    } catch (error) {
      console.error('Get config error:', error);
      throw error;
    }
  });

  ipcMain.handle('config:update', async (_, updates: any) => {
    try {
      await configService.updateConfig(updates);
      return { success: true };
    } catch (error) {
      console.error('Update config error:', error);
      throw error;
    }
  });

  // Updater handlers
  ipcMain.handle('updater:check-for-updates', async () => {
    try {
      updaterService.checkForUpdates();
      return { success: true };
    } catch (error) {
      console.error('Check for updates error:', error);
      throw error;
    }
  });

  ipcMain.handle('updater:is-update-available', async () => {
    try {
      return updaterService.isUpdateAvailable();
    } catch (error) {
      console.error('Check update available error:', error);
      throw error;
    }
  });
}
