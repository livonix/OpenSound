import { ipcMain, shell, app, BrowserWindow } from 'electron';
import { ConfigService } from '../services/config';
import { SpotifyService } from '../services/spotify';
import { YouTubeService } from '../services/youtube';
// YouTubeStreamingService removed - using Lavalink instead
import { StreamService } from '../services/streamer';
import { CacheService } from '../services/cache';
import { PlaybackService } from '../services/playback';
import { PlaylistService } from '../services/playlist';
import { LikedSongsService } from '../services/likedSongs';
import { UpdaterService } from '../services/updater';
import { followedArtistsService } from '../services/followedArtists';
import { Track, Artist } from '../../shared/types';

let configService: ConfigService;
let spotifyService: SpotifyService;
let youtubeService: YouTubeService;
// youtubeStreamingService removed - using Lavalink instead
let streamService: StreamService;
let cacheService: CacheService;
let playbackService: PlaybackService;
let playlistService: PlaylistService;
let likedSongsService: LikedSongsService;
let updaterService: UpdaterService;

export function setupIpcHandlers(): void {
  // Initialize services
  configService = new ConfigService();
  const config = configService.getConfig();
  
  spotifyService = new SpotifyService(config.spotify.clientId, config.spotify.clientSecret);
  youtubeService = new YouTubeService();
  // youtubeStreamingService removed - using Lavalink instead
  streamService = new StreamService();
  cacheService = new CacheService(config.cache);
  playbackService = new PlaybackService(streamService, spotifyService);
  playlistService = new PlaylistService();
  likedSongsService = new LikedSongsService();
  updaterService = new UpdaterService();

  // Setup playback event forwarding
  playbackService.on('queue-updated', (queue: Track[]) => {
    // Forward to all renderer windows
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      window.webContents.send('playback:queue-updated', queue);
    });
  });

  playbackService.on('track-added-to-queue', (track: Track) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      window.webContents.send('playback:track-added-to-queue', track);
    });
  });

  playbackService.on('track-removed-from-queue', (track: Track, index: number) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      window.webContents.send('playback:track-removed-from-queue', track, index);
    });
  });

  playbackService.on('next-track-preloaded', (track: Track) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      window.webContents.send('playback:next-track-preloaded', track);
    });
  });

  playbackService.on('track-changed', (track: Track) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      window.webContents.send('playback:track-changed', track);
    });
  });

  playbackService.on('track-ended', () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      window.webContents.send('playback:track-ended');
    });
  });

  // Test Discord RPC
  ipcMain.handle('discord:test', () => {
    const discordRPC = playbackService.getDiscordRPC();
    if (discordRPC && discordRPC.testConnection) {
      discordRPC.testConnection();
      return { success: true };
    }
    return { success: false, error: 'Discord RPC not available' };
  });

  // Discord RPC update handlers
  ipcMain.handle('discord:update-track', (_, track: Track) => {
    const discordRPC = playbackService.getDiscordRPC();
    if (discordRPC && discordRPC.updateTrack) {
      discordRPC.updateTrack(track);
      return { success: true };
    }
    return { success: false, error: 'Discord RPC not available' };
  });

  ipcMain.handle('discord:update-playing-state', (_, isPlaying: boolean) => {
    const discordRPC = playbackService.getDiscordRPC();
    if (discordRPC && discordRPC.updatePlayingState) {
      discordRPC.updatePlayingState(isPlaying);
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
      
      // YouTube search now handled by PlaybackService with Lavalink
      const tracks = await playbackService['youtubeService'].searchTracks(query);
      console.log('IPC: YouTube search returned', tracks.length, 'tracks');
      
      // Convert to renderer-friendly format
      const mappedTracks = tracks.map((track: any) => ({
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
      // YouTube stream URL now handled by PlaybackService with Lavalink
      const streamInfo = await playbackService['youtubeService'].getStreamUrl(videoId);
      return streamInfo.streamUrl; // Return only the URL string
    } catch (error) {
      console.error('YouTube stream URL error:', error);
      throw error;
    }
  });

  // Playback handlers
  ipcMain.handle('playback:play', async (_, track: any) => {
    try {
      const result = await playbackService.play(track);
      return result;
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

  ipcMain.handle('playback:next', async () => {
    try {
      await playbackService.next();
      return { success: true };
    } catch (error) {
      console.error('Next track error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:previous', async () => {
    try {
      await playbackService.previous();
      return { success: true };
    } catch (error) {
      console.error('Previous track error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:stop', async () => {
    try {
      await playbackService.stop();
      return { success: true };
    } catch (error) {
      console.error('Stop error:', error);
      throw error;
    }
  });

  // Queue handlers
  ipcMain.handle('queue:set', async (_, tracks: Track[]) => {
    try {
      playbackService.setQueue(tracks);
      return { success: true };
    } catch (error) {
      console.error('Set queue error:', error);
      throw error;
    }
  });

  ipcMain.handle('queue:add', async (_, track: Track) => {
    try {
      playbackService.addToQueue(track);
      return { success: true };
    } catch (error) {
      console.error('Add to queue error:', error);
      throw error;
    }
  });

  ipcMain.handle('queue:remove', async (_, index: number) => {
    try {
      playbackService.removeFromQueue(index);
      return { success: true };
    } catch (error) {
      console.error('Remove from queue error:', error);
      throw error;
    }
  });

  ipcMain.handle('queue:get', async () => {
    try {
      return playbackService.getQueue();
    } catch (error) {
      console.error('Get queue error:', error);
      throw error;
    }
  });

  ipcMain.handle('queue:clear', async () => {
    try {
      playbackService.clearQueue();
      return { success: true };
    } catch (error) {
      console.error('Clear queue error:', error);
      throw error;
    }
  });

  // Preloading handlers
  ipcMain.handle('playback:set-preload-threshold', async (_, threshold: number) => {
    try {
      playbackService.setPreloadThreshold(threshold);
      return { success: true };
    } catch (error) {
      console.error('Set preload threshold error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:get-preload-threshold', async () => {
    try {
      return playbackService.getPreloadThreshold();
    } catch (error) {
      console.error('Get preload threshold error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:is-next-track-preloaded', async () => {
    try {
      return playbackService.isNextTrackPreloaded();
    } catch (error) {
      console.error('Check if next track preloaded error:', error);
      throw error;
    }
  });

  ipcMain.handle('playback:get-next-track', async () => {
    try {
      return playbackService.getNextTrack();
    } catch (error) {
      console.error('Get next track error:', error);
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

  // Smart queue handlers
  ipcMain.handle('queue:generate-smart', async (_, seedTrack: any, queueSize?: number) => {
    try {
      const smartQueue = await playbackService.generateSmartQueue(seedTrack, queueSize);
      return { success: true, queue: smartQueue };
    } catch (error) {
      console.error('Error generating smart queue:', error);
      throw error;
    }
  });

  ipcMain.handle('queue:add-smart', async (_, additionalCount?: number) => {
    try {
      const updatedQueue = await playbackService.addToQueueSmart(additionalCount);
      return { success: true, queue: updatedQueue };
    } catch (error) {
      console.error('Error adding smart recommendations:', error);
      throw error;
    }
  });

  ipcMain.handle('queue:get-stats', async () => {
    try {
      const stats = playbackService.getQueueStats();
      return { success: true, stats };
    } catch (error) {
      console.error('Error getting queue stats:', error);
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

  // Liked Songs handlers
  ipcMain.handle('liked-songs:get', async () => {
    try {
      return likedSongsService.getLikedSongs();
    } catch (error) {
      console.error('Get liked songs error:', error);
      throw error;
    }
  });

  ipcMain.handle('liked-songs:is-liked', async (_, trackId: string) => {
    try {
      return likedSongsService.isTrackLiked(trackId);
    } catch (error) {
      console.error('Check if track is liked error:', error);
      throw error;
    }
  });

  ipcMain.handle('liked-songs:toggle', async (_, track: Track) => {
    try {
      const isLiked = likedSongsService.toggleLikeTrack(track);
      return { success: true, isLiked };
    } catch (error) {
      console.error('Toggle like track error:', error);
      throw error;
    }
  });

  ipcMain.handle('liked-songs:like', async (_, track: Track) => {
    try {
      likedSongsService.likeTrack(track);
      return { success: true };
    } catch (error) {
      console.error('Like track error:', error);
      throw error;
    }
  });

  ipcMain.handle('liked-songs:unlike', async (_, trackId: string) => {
    try {
      likedSongsService.unlikeTrack(trackId);
      return { success: true };
    } catch (error) {
      console.error('Unlike track error:', error);
      throw error;
    }
  });

  ipcMain.handle('liked-songs:add-liked-property', async (_, tracks: Track[]) => {
    try {
      return likedSongsService.addLikedPropertyToTracks(tracks);
    } catch (error) {
      console.error('Add liked property to tracks error:', error);
      throw error;
    }
  });

  // Followed Artists handlers
  ipcMain.handle('followed-artists:get', async () => {
    try {
      return followedArtistsService.getFollowedArtists();
    } catch (error) {
      console.error('Get followed artists error:', error);
      throw error;
    }
  });

  ipcMain.handle('followed-artists:is-following', async (_, artistId: string) => {
    try {
      return followedArtistsService.isFollowing(artistId);
    } catch (error) {
      console.error('Check if artist is followed error:', error);
      throw error;
    }
  });

  ipcMain.handle('followed-artists:toggle', async (_, artist: Artist) => {
    try {
      const isFollowing = followedArtistsService.toggleFollowArtist(artist);
      return { success: true, isFollowing };
    } catch (error) {
      console.error('Toggle follow artist error:', error);
      throw error;
    }
  });

  ipcMain.handle('followed-artists:follow', async (_, artist: Artist) => {
    try {
      followedArtistsService.followArtist(artist);
      return { success: true };
    } catch (error) {
      console.error('Follow artist error:', error);
      throw error;
    }
  });

  ipcMain.handle('followed-artists:unfollow', async (_, artistId: string) => {
    try {
      followedArtistsService.unfollowArtist(artistId);
      return { success: true };
    } catch (error) {
      console.error('Unfollow artist error:', error);
      throw error;
    }
  });

  ipcMain.handle('followed-artists:get-count', async () => {
    try {
      return followedArtistsService.getFollowedArtistsCount();
    } catch (error) {
      console.error('Get followed artists count error:', error);
      throw error;
    }
  });

  ipcMain.handle('followed-artists:add-followed-property', async (_, artists: Artist[]) => {
    try {
      const followedArtists = followedArtistsService.getFollowedArtists();
      const followedIds = new Set(followedArtists.map(a => a.id));
      
      return artists.map(artist => ({
        ...artist,
        followed: followedIds.has(artist.id)
      }));
    } catch (error) {
      console.error('Add followed property to artists error:', error);
      throw error;
    }
  });
}
