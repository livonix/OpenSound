import { Router, Request, Response } from 'express';
import { PlayerManager } from '../services/PlayerManager';
import axios from 'axios';
import { spawn } from 'child_process';

export const playerRoutes = (playerManager: PlayerManager): Router => {
  const router = Router();
  const PROXY_BASE_URL = "http://localhost:3001/api/player/audio-proxy";

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

  // Proxy Audio via yt-dlp (La solution robuste)
  router.get('/audio-proxy/:encodedTrack', async (req: Request, res: Response) => {
    try {
      const { encodedTrack } = req.params;
      
      // 1. Décoder via Lavalink
      const decodeResponse = await axios.get('http://localhost:2333/v4/decodetrack', {
        params: { encodedTrack },
        headers: { Authorization: 'youshallnotpass' }
      });

      const videoId = decodeResponse.data?.info?.identifier;
      if (!videoId) return res.status(404).json({ error: 'Track not found' });

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // 2. Configurer la réponse HTTP
      res.setHeader("Content-Type", "audio/webm");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");

      // 3. Spawner yt-dlp
      // -f bestaudio : Choisit la meilleure qualité audio disponible
      // -o - : Sortie vers stdout pour pouvoir le "piper"
      const ytdlp = spawn('yt-dlp', [
        '-f', 'bestaudio', 
        '--no-playlist', 
        '-o', '-', 
        videoUrl
      ]);

      ytdlp.stdout.pipe(res);

      ytdlp.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data}`);
      });

      ytdlp.on('error', (err) => {
        console.error("❌ Process spawn error:", err);
        if (!res.writableEnded) res.status(500).send("Stream error");
      });

      // Cleanup si le client ferme la connexion
      req.on('close', () => {
        ytdlp.kill();
      });

    } catch (error: any) {
      console.error("❌ Audio proxy fatal error:", error.message);
      res.status(500).json({ error: "Failed to stream audio" });
    }
  });

  return router;
};