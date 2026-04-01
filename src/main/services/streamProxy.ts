import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import axios from 'axios';

export class StreamProxyService {
  private server: Server | null = null;
  private port: number = 3001;

  constructor() {
    // StreamProxyService updated to proxy Lavalink YouTube streams
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
          
          // Handle Lavalink YouTube streaming requests
          if (url.startsWith('/stream/youtube/stream/')) {
            // Extract the Lavalink URL path after /stream/
            const lavalinkPath = url.replace('/stream', '');
            const lavalinkUrl = `http://localhost:2333${lavalinkPath}`;
            
            console.log(`Proxying YouTube stream request to: ${lavalinkUrl}`);
            
            try {
              // Forward request to Lavalink with authentication
              const response = await axios.get(lavalinkUrl, {
                headers: {
                  'Authorization': 'youshallnotpass',
                  'User-Agent': req.headers['user-agent'] || 'OpenSound/1.0'
                },
                responseType: 'stream'
              });

              // Forward response headers
              const contentType = response.headers['content-type'] || 'audio/mpeg';
              res.writeHead(response.status || 200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Range, Authorization'
              });

              // Pipe the stream to the response
              response.data.pipe(res);
              
            } catch (error) {
              console.error('Error proxying to Lavalink:', error);
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end('Bad Gateway - Failed to proxy to Lavalink');
            }
          } else if (url === '/test' || url === '/stream/test') {
            console.log('Test endpoint called');
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Lavalink Stream Proxy server is working!');
          } else {
            console.log(`404 for path: ${url}`);
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
        console.log(`Lavalink Stream proxy server started on port ${this.port}`);
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