import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { YouTubeStreamingService } from './youtubeStreaming';
import axios from 'axios';

export class StreamProxyService {
  private server: Server | null = null;
  private youtubeService: YouTubeStreamingService;
  private port: number = 3001;

  constructor() {
    this.youtubeService = new YouTubeStreamingService();
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject(new Error('Stream proxy server already running'));
        return;
      }

      this.server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const url = req.url || '';
          console.log(`Proxy server received request: ${req.method} ${url}`);
          
          // Handle streaming requests
          if (url.startsWith('/stream/')) {
            const videoId = url.replace('/stream/', '');
            console.log(`Proxy stream request for video: ${videoId}`);

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Content-Length');

            // Handle preflight requests
            if (req.method === 'OPTIONS') {
              console.log('Handling preflight request');
              res.writeHead(200);
              res.end();
              return;
            }

            try {
              // Get streaming URL from YouTube service
              const streamInfo = await this.youtubeService.getStreamUrl(videoId);
              console.log(`Proxying stream from: ${streamInfo.streamUrl.substring(0, 50)}...`);

              // Handle range requests for seeking
              const range = req.headers.range;
              if (range) {
                console.log(`Range request: ${range}`);
                // Forward range request to YouTube
                const response = await axios({
                  method: 'GET',
                  url: streamInfo.streamUrl,
                  responseType: 'stream',
                  headers: {
                    'Range': range,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Referer': 'https://www.youtube.com/'
                  },
                  timeout: 30000
                });

                // Copy response headers
                Object.keys(response.headers).forEach(key => {
                  if (response.headers[key]) {
                    res.setHeader(key, response.headers[key] as string);
                  }
                });

                // Add CORS headers again
                res.setHeader('Access-Control-Allow-Origin', '*');

                // Pipe the response
                res.writeHead(response.status);
                response.data.pipe(res);
              } else {
                // Regular request without range
                console.log('Regular streaming request');
                const response = await axios({
                  method: 'GET',
                  url: streamInfo.streamUrl,
                  responseType: 'stream',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Referer': 'https://www.youtube.com/'
                  },
                  timeout: 30000
                });

                // Copy response headers
                Object.keys(response.headers).forEach(key => {
                  if (response.headers[key]) {
                    res.setHeader(key, response.headers[key] as string);
                  }
                });

                // Add CORS headers
                res.setHeader('Access-Control-Allow-Origin', '*');

                // Pipe the response
                res.writeHead(response.status);
                response.data.pipe(res);
              }
            } catch (streamError) {
              console.error('Error getting stream for video:', videoId, streamError);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Failed to get stream URL');
            }
          } else if (url === '/test' || url === '/stream/test') {
            console.log('Test endpoint called');
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Proxy server is working!');
          } else {
            console.log(`404 for path: ${url}`);
            // 404 for other routes
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          }
        } catch (error) {
          console.error('Stream proxy server error:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        }
      });

      this.server.listen(this.port, () => {
        console.log(`Stream proxy server started on port ${this.port}`);
        console.log(`Test URL: http://localhost:${this.port}/stream/test`);
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('Stream proxy server error:', error);
        reject(error);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Stream proxy server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  public getPort(): number {
    return this.port;
  }
}
