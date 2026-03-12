import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';
import { YouTubeVideo, StreamInfo } from '../../shared/types';

export class YouTubeService {
  private ytDlpPath: string;
  private audioUrlCache: Map<string, { url: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (augmenté pour la performance)

  constructor() {
    // Try to find yt-dlp in common locations
    this.ytDlpPath = this.findYtDlp();
  }

  private findYtDlp(): string {
    const possiblePaths = [
      './yt-dlp.exe',  // Windows executable in project root
      'yt-dlp',
      './yt-dlp',
      './bin/yt-dlp',
      '/usr/local/bin/yt-dlp',
      '/usr/bin/yt-dlp',
    ];

    for (const path of possiblePaths) {
      try {
        const process = spawn(path, ['--version'], { stdio: 'ignore' });
        process.on('error', () => {});
        process.kill();
        return path;
      } catch {
        continue;
      }
    }

    throw new Error('yt-dlp not found. Please install yt-dlp and ensure it\'s in your PATH.');
  }

  public async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    return new Promise((resolve, reject) => {
      const sanitizedQuery = this.sanitizeQuery(query);
      const args = [
        'ytsearch' + maxResults + ':' + sanitizedQuery,
        '--no-warnings',
        '--format',
        'bestaudio',
        '--dump-json',
        '--no-playlist'
      ];

      const process = spawn(this.ytDlpPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp search failed: ${stderr}`));
          return;
        }

        try {
          const lines = stdout.trim().split('\n').filter(line => line.trim());
          const videos = lines.map(line => {
            const data = JSON.parse(line);
            return {
              id: data.id,
              title: data.title,
              channel: data.uploader || data.channel,
              duration: data.duration,
              url: data.webpage_url,
              thumbnail: data.thumbnail
            };
          });

          resolve(videos);
        } catch (error) {
          reject(new Error(`Failed to parse yt-dlp output: ${error}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });
  }

  public async getStreamInfo(videoId: string): Promise<StreamInfo> {
    return new Promise((resolve, reject) => {
      const args = [
        '--no-warnings',
        '--format',
        'bestaudio/best[height<=0]',
        '--dump-json',
        `https://www.youtube.com/watch?v=${videoId}`
      ];

      const process = spawn(this.ytDlpPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp stream info failed: ${stderr}`));
          return;
        }

        try {
          const data = JSON.parse(stdout.trim());
          const format = data.formats?.find((f: any) => f.acodec !== 'none' && f.vcodec === 'none') || 
                        data.formats?.[0];

          resolve({
            videoId: data.id,
            streamUrl: format?.url || '',
            format: format?.format_id || '',
            bitrate: format?.abr || 0
          });
        } catch (error) {
          reject(new Error(`Failed to parse stream info: ${error}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });
  }

  public async getDirectAudioUrl(videoId: string): Promise<string> {
    // Check cache first
    const cached = this.audioUrlCache.get(videoId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log('Using cached URL for video:', videoId);
      return cached.url;
    }

    return new Promise((resolve, reject) => {
      const args = [
        '--no-warnings',
        '--no-playlist',
        '--skip-download',
        '--flat-playlist',
        '--no-check-certificates',
        '--quiet',
        '--format',
        'ba', // bestaudio ultra-rapide
        '-g', // Get direct URL
        `https://www.youtube.com/watch?v=${videoId}`
      ];

      const process = spawn(this.ytDlpPath, args);
      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          console.log(`First attempt failed, trying fallback format...`);
          // Try with just 'worst' as last resort
          const fallbackArgs = [
            '--no-warnings',
            '--no-playlist',
            '--skip-download',
            '--flat-playlist',
            '--no-check-certificates',
            '--quiet',
            '--format',
            'worst',
            '-g',
            `https://www.youtube.com/watch?v=${videoId}`
          ];
          
          const fallbackProcess = spawn(this.ytDlpPath, fallbackArgs);
          let fallbackStdout = '';
          let fallbackStderr = '';
          
          fallbackProcess.stdout.on('data', (data) => {
            fallbackStdout += data.toString();
          });
          
          fallbackProcess.stderr.on('data', (data) => {
            fallbackStderr += data.toString();
          });
          
          fallbackProcess.on('close', (fallbackCode) => {
            if (fallbackCode !== 0) {
              reject(new Error(`yt-dlp failed for both formats. Original: ${stderr}, Fallback: ${fallbackStderr}`));
              return;
            }
            
            const url = fallbackStdout.trim();
            if (url) {
              // Cache the fallback URL too
              this.audioUrlCache.set(videoId, { url, timestamp: Date.now() });
              console.log('Cached fallback URL for video:', videoId);
              resolve(url);
            } else {
              reject(new Error('No URL found in fallback'));
            }
          });
          
          fallbackProcess.on('error', (error) => {
            reject(new Error(`Fallback process failed: ${error.message}`));
          });
          return;
        }

        const url = stdout.trim();
        if (url) {
          // Cache the URL
          this.audioUrlCache.set(videoId, { url, timestamp: Date.now() });
          console.log('Cached new URL for video:', videoId);
          resolve(url);
        } else {
          reject(new Error('No direct URL found'));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });
  }

  public getAudioStream(videoId: string): Readable {
    const args = [
      '--no-warnings',
      '--format',
      'bestaudio/best[height<=0]',
      '-o',
      '-', // Output to stdout
      `https://www.youtube.com/watch?v=${videoId}`
    ];

    const process = spawn(this.ytDlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Handle process errors
    process.on('error', (error) => {
      console.error('yt-dlp process error:', error);
    });

    process.stderr?.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    return process.stdout!;
  }

  public findBestMatch(videos: YouTubeVideo[], trackTitle: string, artistName: string): YouTubeVideo | null {
    const searchTerms = [
      `${artistName} - ${trackTitle}`,
      `${artistName} ${trackTitle}`,
      `${trackTitle} ${artistName}`
    ];

    let bestMatch: YouTubeVideo | null = null;
    let bestScore = 0;

    for (const video of videos) {
      const score = this.calculateMatchScore(video, trackTitle, artistName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = video;
      }
    }

    // Only return matches with a reasonable score
    return bestScore > 0.3 ? bestMatch : null;
  }

  private calculateMatchScore(video: YouTubeVideo, trackTitle: string, artistName: string): number {
    const videoTitle = video.title.toLowerCase();
    const videoChannel = video.channel.toLowerCase();
    const title = trackTitle.toLowerCase();
    const artist = artistName.toLowerCase();

    let score = 0;

    // Exact title match
    if (videoTitle.includes(title)) {
      score += 0.4;
    }

    // Artist name match in title
    if (videoTitle.includes(artist)) {
      score += 0.3;
    }

    // Artist name match in channel
    if (videoChannel.includes(artist)) {
      score += 0.2;
    }

    // Prefer official content
    if (videoChannel.includes('official') || 
        videoChannel.includes('vevo') || 
        videoChannel.includes('topic')) {
      score += 0.1;
    }

    // Avoid lyric videos
    if (videoTitle.includes('lyric') || 
        videoTitle.includes('karaoke') || 
        videoTitle.includes('instrumental')) {
      score -= 0.2;
    }

    // Avoid live performances
    if (videoTitle.includes('live') || 
        videoTitle.includes('concert') || 
        videoTitle.includes('performance')) {
      score -= 0.2;
    }

    // Avoid remixes
    if (videoTitle.includes('remix') || 
        videoTitle.includes('edit') || 
        videoTitle.includes('version')) {
      score -= 0.1;
    }

    // Prefer videos with "audio" in title
    if (videoTitle.includes('audio')) {
      score += 0.1;
    }

    return Math.max(0, score);
  }

  private sanitizeQuery(query: string): string {
    // Remove special characters that might cause issues with yt-dlp
    return query
      .replace(/[<>:"\\|?*]/g, '')
      .replace(/'/g, '')
      .replace(/"/g, '')
      .trim();
  }

  public async testYtDlp(): Promise<boolean> {
    try {
      await this.searchVideos('test', 1);
      return true;
    } catch {
      return false;
    }
  }
}
