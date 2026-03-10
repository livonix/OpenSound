import axios from 'axios';

// Service pour communiquer directement avec Lavalink (mode Electron)
export class LavalinkAPI {
  private baseUrl: string;
  private password: string;

  constructor() {
    // En mode Electron, on utilise l'URL de Lavalink directement
    this.baseUrl = (window as any).config?.LAVALINK_URL || 'http://localhost:2333';
    this.password = 'youshallnotpass';
  }

  // Rechercher des pistes
  async searchTracks(query: string, source = 'ytsearch') {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/loadtracks`, {
        params: { identifier: `${source}:${query}` },
        headers: { 'Authorization': this.password }
      });
      
      return response.data;
    } catch (error) {
      console.error('Lavalink search error:', error);
      throw error;
    }
  }

  // Décoder une piste
  async decodeTrack(encodedTrack: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/decodetrack`, {
        params: { encodedTrack },
        headers: { 'Authorization': this.password }
      });
      
      return response.data;
    } catch (error) {
      console.error('Lavalink decode error:', error);
      throw error;
    }
  }

  // Obtenir les informations du serveur Lavalink
  async getServerInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/info`, {
        headers: { 'Authorization': this.password }
      });
      
      return response.data;
    } catch (error) {
      console.error('Lavalink info error:', error);
      throw error;
    }
  }

  // Charger une piste pour streaming
  async loadTrack(encodedTrack: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/v4/decodetrack`, {
        params: { encodedTrack },
        headers: { 'Authorization': this.password }
      });
      
      const trackInfo = response.data?.info;
      if (!trackInfo) {
        throw new Error('Track not found');
      }

      // Retourner l'URL de streaming directe de Lavalink
      return {
        streamUrl: trackInfo.uri,
        title: trackInfo.title,
        author: trackInfo.author,
        duration: trackInfo.length,
        artworkUrl: trackInfo.artworkUrl,
        isStream: trackInfo.isStream
      };
    } catch (error) {
      console.error('Load track error:', error);
      throw error;
    }
  }

  // Obtenir le flux audio direct (sans proxy)
  async getAudioStream(encodedTrack: string) {
    try {
      const trackInfo = await this.decodeTrack(encodedTrack);
      
      if (!trackInfo?.info?.uri) {
        throw new Error('No stream URL available');
      }

      return {
        streamUrl: trackInfo.info.uri,
        title: trackInfo.info.title,
        author: trackInfo.info.author,
        duration: trackInfo.info.length,
        artworkUrl: trackInfo.info.artworkUrl,
        isStream: trackInfo.info.isStream
      };
    } catch (error) {
      console.error('Get audio stream error:', error);
      throw error;
    }
  }
}

export const lavalinkAPI = new LavalinkAPI();
