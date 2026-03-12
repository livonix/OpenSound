import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { CacheEntry } from '../../shared/types';

export class CacheService {
  private cachePath: string;
  private maxSize: number;
  private ttl: number;
  private memoryCache: Map<string, CacheEntry> = new Map();

  constructor(cacheConfig: { maxSize: number; ttl: number }) {
    this.cachePath = path.join(app.getPath('userData'), 'cache');
    this.maxSize = cacheConfig.maxSize;
    this.ttl = cacheConfig.ttl;
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }
    
    // Load existing cache entries
    this.loadCacheFromDisk();
  }

  private loadCacheFromDisk(): void {
    try {
      const files = fs.readdirSync(this.cachePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cachePath, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const entry: CacheEntry = JSON.parse(data);
          
          // Check if entry is still valid
          if (Date.now() < entry.expiresAt) {
            this.memoryCache.set(entry.key, entry);
          } else {
            // Remove expired entry
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cache from disk:', error);
    }
  }

  public async set(key: string, data: any, customTtl?: number): Promise<void> {
    const expiresAt = Date.now() + (customTtl || this.ttl);
    const entry: CacheEntry = {
      key,
      data,
      expiresAt
    };

    // Add to memory cache
    this.memoryCache.set(key, entry);

    // Save to disk
    try {
      const filePath = path.join(this.cachePath, `${this.sanitizeKey(key)}.json`);
      fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.error('Failed to save cache entry:', error);
    }

    // Check cache size and clean up if necessary
    await this.checkCacheSize();
  }

  public get(key: string): any {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() >= entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  public delete(key: string): void {
    // Remove from memory
    this.memoryCache.delete(key);

    // Remove from disk
    try {
      const filePath = path.join(this.cachePath, `${this.sanitizeKey(key)}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete cache entry:', error);
    }
  }

  public async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear disk cache
    try {
      const files = fs.readdirSync(this.cachePath);
      for (const file of files) {
        const filePath = path.join(this.cachePath, file);
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  public async getSize(): Promise<number> {
    let totalSize = 0;

    // Calculate memory cache size
    for (const entry of this.memoryCache.values()) {
      totalSize += JSON.stringify(entry).length;
    }

    // Calculate disk cache size
    try {
      const files = fs.readdirSync(this.cachePath);
      for (const file of files) {
        const filePath = path.join(this.cachePath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
    }

    return totalSize;
  }

  private async checkCacheSize(): Promise<void> {
    const currentSize = await this.getSize();
    
    if (currentSize > this.maxSize) {
      // Sort entries by expiration time (oldest first)
      const entries = Array.from(this.memoryCache.values())
        .sort((a, b) => a.expiresAt - b.expiresAt);

      // Remove oldest entries until under the limit
      for (const entry of entries) {
        this.delete(entry.key);
        
        const newSize = await this.getSize();
        if (newSize <= this.maxSize * 0.8) { // Leave 20% headroom
          break;
        }
      }
    }
  }

  private sanitizeKey(key: string): string {
    // Replace special characters with underscores
    return key.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
  }

  public getKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  public async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  // Convenience methods for specific data types
  public async setTrackMetadata(trackId: string, metadata: any): Promise<void> {
    await this.set(`track:${trackId}`, metadata, 24 * 60 * 60 * 1000); // 24 hours
  }

  public getTrackMetadata(trackId: string): any {
    return this.get(`track:${trackId}`);
  }

  public async setAlbumMetadata(albumId: string, metadata: any): Promise<void> {
    await this.set(`album:${albumId}`, metadata, 24 * 60 * 60 * 1000); // 24 hours
  }

  public getAlbumMetadata(albumId: string): any {
    return this.get(`album:${albumId}`);
  }

  public async setArtistMetadata(artistId: string, metadata: any): Promise<void> {
    await this.set(`artist:${artistId}`, metadata, 24 * 60 * 60 * 1000); // 24 hours
  }

  public getArtistMetadata(artistId: string): any {
    return this.get(`artist:${artistId}`);
  }

  public async setSearchResults(query: string, results: any): Promise<void> {
    await this.set(`search:${query}`, results, 60 * 60 * 1000); // 1 hour
  }

  public getSearchResults(query: string): any {
    return this.get(`search:${query}`);
  }
}
