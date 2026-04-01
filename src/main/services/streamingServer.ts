import { createServer } from 'http';
import { URL } from 'url';
import axios from 'axios';
import { YouTubeService } from './youtube';
import { StreamInfo } from '../../shared/types';

export class StreamingServer {
  private server: any;
  private port: number;
  private youtubeService: YouTubeService;

  constructor(port: number = 3001) {
    this.port = port;
    this.youtubeService = new YouTubeService();
    // YouTube streaming now handled by Lavalink
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(async (req, res) => {
        try {
          const parsedUrl = new URL(req.url!, `http://localhost:${this.port}`);
          
          if (parsedUrl.pathname.startsWith('/stream/')) {
            let videoId = parsedUrl.pathname.replace('/stream/', '');
            
            // Handle /stream/youtube/ prefix
            if (videoId.startsWith('youtube/')) {
              videoId = videoId.replace('youtube/', '');
              console.log('YouTube streaming request for video:', videoId);
              
              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
              
              if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
              }

              // For YouTube, we need to proxy the actual stream
              // Since Lavalink can't extract URLs, we'll redirect to YouTube embed
              // This is a temporary fallback - the frontend should handle embed differently
              console.log('❌ YouTube streaming not available via proxy (Lavalink extraction failed)');
              res.writeHead(302, { 'Location': `https://www.youtube.com/embed/${videoId}` });
              res.end();
              return;
            }

            console.log('Streaming request for video:', videoId);

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
            
            if (req.method === 'OPTIONS') {
              res.writeHead(200);
              res.end();
              return;
            }

            // Get stream info from YouTube
            const streamInfo = await this.youtubeService.getStreamInfo(videoId);
            
            if (!streamInfo || !streamInfo.streamUrl) {
              console.log('❌ No stream URL found for video:', videoId);
              res.writeHead(404);
              res.end('Stream not found');
              return;
            }

            console.log('🔗 Proxying YouTube stream:', streamInfo.streamUrl.substring(0, 100) + '...');
            
            // Set appropriate headers for audio streaming
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Transfer-Encoding', 'chunked');
            res.setHeader('Connection', 'keep-alive');
            
            // Handle range requests for seeking
            const range = req.headers.range;
            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : streamInfo.bitrate * 1000 * 60 * 5; // 5 minutes max
              
              res.setHeader('Content-Range', `bytes ${start}-${end}/${streamInfo.bitrate * 1000 * 60 * 5}`);
              res.setHeader('Accept-Ranges', 'bytes');
              res.writeHead(206);
            } else {
              res.writeHead(200);
            }

            // Get direct audio URL and stream it
            const directAudioUrl = await this.youtubeService.getDirectAudioUrl(videoId);
            const audioResponse = await axios({
              method: 'GET',
              url: directAudioUrl,
              responseType: 'stream',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.youtube.com/',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'audio',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site'
              }
            });

            audioResponse.data.pipe(res);

            audioResponse.data.on('error', (error: any) => {
              console.error('Audio stream error:', error);
              if (!res.destroyed) {
                res.destroy();
              }
            });

            audioResponse.data.on('end', () => {
              console.log('✅ Audio stream ended for video:', videoId);
              if (!res.destroyed) {
                res.end();
              }
            });

          } else if (parsedUrl.pathname.startsWith('/proxy/')) {
            // Direct proxy for YouTube URLs (fallback)
            const youtubeUrl = decodeURIComponent(parsedUrl.pathname.replace('/proxy/', ''));
            console.log('🔗 Direct proxy request:', youtubeUrl.substring(0, 100) + '...');

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
            
            if (req.method === 'OPTIONS') {
              res.writeHead(200);
              res.end();
              return;
            }

            try {
              // Proxy the YouTube stream directly
              const youtubeResponse = await axios({
                method: 'GET',
                url: youtubeUrl,
                responseType: 'stream',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Referer': 'https://www.youtube.com/',
                  'Accept': '*/*',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept-Encoding': 'gzip, deflate, br',
                  'Connection': 'keep-alive',
                  'Sec-Fetch-Dest': 'audio',
                  'Sec-Fetch-Mode': 'no-cors',
                  'Sec-Fetch-Site': 'cross-site'
                }
              });

              // Copy headers from YouTube response
              const contentType = youtubeResponse.headers['content-type'] || 'audio/mpeg';
              res.setHeader('Content-Type', contentType);
              
              if (youtubeResponse.headers['content-length']) {
                res.setHeader('Content-Length', youtubeResponse.headers['content-length']);
              }

              res.writeHead(200);
              youtubeResponse.data.pipe(res);

              youtubeResponse.data.on('error', (error: any) => {
                console.error('YouTube stream error:', error);
                if (!res.destroyed) {
                  res.destroy();
                }
              });

              youtubeResponse.data.on('end', () => {
                console.log('✅ Direct proxy stream ended');
                if (!res.destroyed) {
                  res.end();
                }
              });

            } catch (proxyError) {
              console.error('❌ Direct proxy failed:', proxyError);
              res.writeHead(500);
              res.end('Proxy failed');
            }

          } else {
            res.writeHead(404);
            res.end('Not found');
          }
        } catch (error) {
          console.error('Streaming server error:', error);
          if (!res.destroyed) {
            res.writeHead(500);
            res.end('Internal server error');
          }
        }
      });

      this.server.listen(this.port, () => {
        console.log(`🎵 Streaming server started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${this.port} is busy, trying ${this.port + 1}`);
          this.port = this.port + 1;
          this.start().then(resolve);
        } else {
          console.error('Streaming server error:', error);
        }
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Streaming server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getPort(): number {
    return this.port;
  }
}
