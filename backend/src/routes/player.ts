import { Router, Request, Response } from 'express';
import { PlayerManager } from '../services/PlayerManager';
import { audioCache } from '../services/AudioCache';
import { recommendationEngine, Track } from '../services/RecommendationEngine';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export const playerRoutes = (playerManager: PlayerManager): Router => {
  const router = Router();
  const PROXY_BASE_URL = "http://localhost:3001/api/player/audio-proxy";

  // Nettoyer le cache au démarrage
  audioCache.cleanup();

  // State
  router.get('/state', (req, res) => {
    try { res.json(playerManager.getState()); } 
    catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  // Play
  router.post('/play', async (req: Request, res: Response) => {
    try {
      const { encodedTrack, guildId, voiceChannelId } = req.body;
      const result = await playerManager.playTrack(encodedTrack, guildId, voiceChannelId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to play' });
    }
  });

  // Pause/Stop/Volume/Seek (omitted for brevity, keep your existing logic)
  router.post('/pause', (req, res) => res.json(playerManager.setPause(req.body.guildId, req.body.paused)));
  router.post('/stop', (req, res) => res.json(playerManager.stop(req.body.guildId)));
  router.post('/volume', (req, res) => res.json(playerManager.setVolume(req.body.guildId, req.body.volume)));
  router.post('/seek', (req, res) => res.json(playerManager.seek(req.body.guildId, req.body.position)));

  // Stream Metadata
  router.get('/stream/:encodedTrack', async (req: Request, res: Response) => {
    try {
      const { encodedTrack } = req.params;
      const decodeResponse = await axios.get('http://localhost:2333/v4/decodetrack', {
        params: { encodedTrack },
        headers: { Authorization: 'youshallnotpass' }
      });

      const info = decodeResponse.data?.info;
      if (!info) return res.status(404).json({ error: 'Track not found' });

      res.json({
        streamUrl: `${PROXY_BASE_URL}/${encodeURIComponent(encodedTrack)}`,
        title: info.title,
        author: info.author,
        duration: info.length,
        artworkUrl: info.artworkUrl,
        isLiveStream: info.isStream
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stream' });
    }
  });

  // Audio proxy avec cache pour lecture instantanée
  router.get('/audio-proxy/:encodedTrack', async (req, res) => {
    try {
      const { encodedTrack } = req.params;
      
      // 1. Décoder le track pour obtenir le videoId
      const decodeResponse = await axios.get(
        `http://localhost:2333/v4/decodetrack`,
        {
          params: { encodedTrack },
          headers: { 'Authorization': 'youshallnotpass' }
        }
      );
      
      const videoId = decodeResponse.data?.info?.identifier;
      if (!videoId) return res.status(404).json({ error: 'Track not found' });

      // 2. Vérifier si on a déjà l'audio en cache
      const cachedAudio = await audioCache.getCachedAudio(videoId);
      if (cachedAudio) {
        console.log(`⚡ Serving cached audio for ${videoId}`);
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "public, max-age=3600");
        
        const fileStream = fs.createReadStream(cachedAudio);
        fileStream.pipe(res);
        return;
      }

      // 3. Si pas en cache, télécharger et streamer
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");

      const ytdlp = spawn('yt-dlp', [
        '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best', // Try multiple formats
        '--no-playlist',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--no-cache-dir',
        '--audio-quality', '0',
        '--add-header', 'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // Add user agent
        '-o', '-',
        videoUrl
      ]);

      // Créer un fichier temporaire pour le cache
      const tempPath = path.join(__dirname, '../../cache', `temp_${videoId}_${Date.now()}.mp3`);
      const tempStream = fs.createWriteStream(tempPath);
      
      // Pipe vers le client et vers le fichier temporaire
      ytdlp.stdout.pipe(res);
      ytdlp.stdout.pipe(tempStream);

      ytdlp.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data}`);
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          // Déplacer le fichier temporaire vers le cache
          try {
            await audioCache.cacheAudio(videoId, tempPath);
          } catch (error) {
            console.error('Cache save error:', error);
            // Nettoyer le fichier temporaire si erreur
            if (fs.existsSync(tempPath)) {
              fs.unlinkSync(tempPath);
            }
          }
        } else {
          // Nettoyer le fichier temporaire si erreur
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        }
      });

      req.on('close', () => {
        ytdlp.kill();
      });

    } catch (error: any) {
      console.error("❌ Audio proxy error:", error.message);
      res.status(500).json({ error: "Failed to stream audio" });
    }
  });

  // Skip track with automatic recommendation
  router.post('/skip', async (req: Request, res: Response) => {
    try {
      const { guildId, userId, currentTrack, skipPosition } = req.body;
      
      if (!currentTrack) {
        return res.status(400).json({ error: 'Current track is required' });
      }

      console.log(`⏭️ Skip request for track: ${currentTrack.title} at position: ${skipPosition || 'unknown'}`);

      // Track the skip for learning
      const trackData: Track = {
        title: currentTrack.title,
        author: currentTrack.author,
        duration: currentTrack.duration,
        identifier: currentTrack.identifier,
        uri: currentTrack.uri,
        artworkUrl: currentTrack.artworkUrl,
        encoded: currentTrack.encoded
      };

      // Get next recommendation
      const recommendation = await recommendationEngine.getNextRecommendation(
        userId || 'default', 
        trackData, 
        skipPosition
      );

      if (recommendation) {
        console.log(`🎵 Recommended next track: ${recommendation.title} by ${recommendation.author}`);
        
        // Track the play for the new recommendation
        recommendationEngine.trackPlay(userId || 'default', recommendation);
        
        res.json({
          success: true,
          recommendation: {
            title: recommendation.title,
            author: recommendation.author,
            duration: recommendation.duration,
            identifier: recommendation.identifier,
            uri: recommendation.uri,
            artworkUrl: recommendation.artworkUrl,
            encoded: recommendation.encoded
          },
          message: `Skipped to: ${recommendation.title}`
        });
      } else {
        // Fallback: search for similar music
        const fallbackQuery = `${trackData.author} ${trackData.title.split(' ')[0]}`;
        console.log(`🔍 Using fallback search: ${fallbackQuery}`);
        
        try {
          const searchResponse = await axios.get(
            `http://localhost:2333/v4/loadtracks`,
            {
              params: {
                identifier: `ytsearch:${fallbackQuery}`
              },
              headers: {
                'Authorization': 'youshallnotpass'
              }
            }
          );

          if (searchResponse.data?.data?.length > 0) {
            const fallbackTrack = searchResponse.data.data[0];
            res.json({
              success: true,
              recommendation: {
                title: fallbackTrack.info?.title || 'Unknown',
                author: fallbackTrack.info?.author || 'Unknown',
                duration: fallbackTrack.info?.length || 0,
                identifier: fallbackTrack.info?.identifier || '',
                uri: fallbackTrack.info?.uri || '',
                artworkUrl: fallbackTrack.info?.artworkUrl || '',
                encoded: fallbackTrack.encoded
              },
              message: `Skipped to: ${fallbackTrack.info?.title}`
            });
          } else {
            res.json({
              success: false,
              message: 'No recommendations available'
            });
          }
        } catch (searchError) {
          console.error('Fallback search failed:', searchError);
          res.status(500).json({ error: 'Failed to find recommendation' });
        }
      }
    } catch (error) {
      console.error('Skip error:', error);
      res.status(500).json({ error: 'Failed to skip track' });
    }
  });

  // Track user search for better recommendations
  router.post('/track-search', (req: Request, res: Response) => {
    try {
      const { userId, query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      recommendationEngine.trackSearch(userId || 'default', query);
      
      res.json({ success: true, message: 'Search tracked' });
    } catch (error) {
      console.error('Track search error:', error);
      res.status(500).json({ error: 'Failed to track search' });
    }
  });

  // Get user recommendation stats
  router.get('/stats/:userId', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const stats = recommendationEngine.getUserStats(userId);
      
      if (!stats) {
        return res.json({
          totalPlays: 0,
          totalSkips: 0,
          favoriteGenres: [],
          favoriteArtists: [],
          recentSearches: []
        });
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  return router;
};