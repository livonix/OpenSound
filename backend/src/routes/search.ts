import { Router, Request, Response } from 'express';
import { Shoukaku } from 'shoukaku';
import axios from 'axios';

export const searchRoutes = (shoukaku: Shoukaku | null): Router => {
  const router = Router();

  // Search for tracks
  router.get('/tracks', async (req: Request, res: Response) => {
    try {
      const { query, source = 'ytsearch' } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      // Use direct REST API call to Lavalink
      const response = await axios.get(
        `http://localhost:2333/v4/loadtracks`,
        {
          params: {
            identifier: `${source}:${query}`
          },
          headers: {
            'Authorization': 'youshallnotpass'
          }
        }
      );
      
      const result = response.data;
      
      console.log('Lavalink response:', JSON.stringify(result, null, 2));
      
      if (!result.data || result.data.length === 0) {
        console.log('No tracks found in result');
        return res.json({ tracks: [], type: 'empty' });
      }

      const tracks = result.data.map((track: any) => {
        const mappedTrack = {
        title: track.info?.title || 'Unknown Title',
        author: track.info?.author || 'Unknown Artist',
        duration: track.info?.length || 0,
        identifier: track.info?.identifier || '',
        isSeekable: track.info?.isSeekable || false,
        isStream: track.info?.isStream || false,
        sourceName: track.info?.sourceName || 'unknown',
        position: track.info?.position || 0,
        uri: track.info?.uri || '',
        artworkUrl: track.info?.artworkUrl || '',
        isrc: track.info?.isrc || '',
        encoded: track.encoded
      };
      console.log('Mapped track:', { title: mappedTrack.title, hasArtwork: !!mappedTrack.artworkUrl });
      return mappedTrack;
      });

      res.json({
        tracks,
        type: result.loadType || 'search',
        playlistInfo: result.playlistInfo || null
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search tracks' });
    }
  });

  // Get track details by identifier
  router.get('/track/:identifier', async (req: Request, res: Response) => {
    try {
      const { identifier } = req.params;
      
      // Use direct REST API call to Lavalink
      const response = await axios.get(
        `http://localhost:2333/v4/decodetrack`,
        {
          params: {
            encodedTrack: identifier
          },
          headers: {
            'Authorization': 'youshallnotpass'
          }
        }
      );
      
      const result = response.data;
      
      if (!result) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      res.json({
        title: result.info?.title || 'Unknown Title',
        author: result.info?.author || 'Unknown Artist',
        duration: result.info?.length || 0,
        identifier: result.info?.identifier || '',
        isSeekable: result.info?.isSeekable || false,
        isStream: result.info?.isStream || false,
        sourceName: result.info?.sourceName || 'unknown',
        position: result.info?.position || 0,
        uri: result.info?.uri || '',
        artworkUrl: result.info?.artworkUrl || '',
        isrc: result.info?.isrc || ''
      });
    } catch (error) {
      console.error('Track decode error:', error);
      res.status(500).json({ error: 'Failed to get track details' });
    }
  });

  return router;
};
