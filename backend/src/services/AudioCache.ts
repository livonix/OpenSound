import fs from 'fs';
import path from 'path';

export class AudioCache {
  private cacheDir = path.join(__dirname, '../../cache');
  private cache = new Map<string, { filePath: string; timestamp: number }>();

  constructor() {
    // Créer le dossier cache si il n'existe pas
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getCacheKey(videoId: string): string {
    return videoId;
  }

  getCachePath(videoId: string): string {
    return path.join(this.cacheDir, `${videoId}.mp3`);
  }

  async getCachedAudio(videoId: string): Promise<string | null> {
    const cachePath = this.getCachePath(videoId);
    
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      // Cache valide pendant 1 heure
      const maxAge = 60 * 60 * 1000; // 1 heure en ms
      
      if (Date.now() - stats.mtime.getTime() < maxAge) {
        console.log(`🎵 Using cached audio for ${videoId}`);
        return cachePath;
      } else {
        // Cache expiré, supprimer
        fs.unlinkSync(cachePath);
      }
    }
    
    return null;
  }

  async cacheAudio(videoId: string, tempPath: string): Promise<string> {
    const cachePath = this.getCachePath(videoId);
    
    // Déplacer le fichier temporaire vers le cache
    fs.renameSync(tempPath, cachePath);
    console.log(`💾 Cached audio for ${videoId}`);
    
    return cachePath;
  }

  // Nettoyer les anciens fichiers cache
  cleanup(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const maxAge = 60 * 60 * 1000; // 1 heure
      
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up old cache: ${file}`);
        }
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Obtenir les statistiques du cache
  getCacheStats(): { size: string; count: number } {
    try {
      const files = fs.readdirSync(this.cacheDir);
      let totalSize = 0;
      
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
      
      // Formater la taille en MB
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      return {
        size: `${sizeInMB} MB`,
        count: files.length
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { size: '0 MB', count: 0 };
    }
  }

  // Vider complètement le cache
  clearCache(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted cache file: ${file}`);
      });
      
      console.log(`✅ Cleared ${files.length} cache files`);
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error;
    }
  }
}

export const audioCache = new AudioCache();
