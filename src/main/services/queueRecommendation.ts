import { Track } from '../../shared/types';
import { SpotifyService } from './spotify';

interface TrackFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  tempo: number;
  genres: string[];
  artists: string[];
}

interface RecommendationScore {
  track: Track;
  score: number;
  reason: 'similar_genre' | 'similar_mood' | 'discovery' | 'artist_collaboration';
}

export class QueueRecommendationService {
  private spotifyService: SpotifyService;
  private trackFeaturesCache: Map<string, TrackFeatures> = new Map();

  constructor(spotifyService: SpotifyService) {
    this.spotifyService = spotifyService;
  }

  /**
   * Génère une file d'attente intelligente basée sur une musique de départ
   */
  public async generateSmartQueue(seedTrack: Track, queueSize: number = 20): Promise<Track[]> {
    console.log(`Generating smart queue for "${seedTrack.name}" with ${queueSize} tracks`);
    
    try {
      // 1. Obtenir les caractéristiques de la musique de départ
      const seedFeatures = await this.getTrackFeatures(seedTrack);
      
      // 2. Récupérer les recommandations de Spotify
      const recommendations = await this.getSpotifyRecommendations(seedTrack, queueSize * 2);
      
      // 3. Analyser et scorer chaque recommandation
      const scoredRecommendations = await this.scoreRecommendations(recommendations, seedFeatures, seedTrack);
      
      // 4. Sélectionner un équilibre de musiques similaires et découvertes
      const finalQueue = this.selectBalancedQueue(scoredRecommendations, queueSize);
      
      console.log(`Generated queue with ${finalQueue.length} tracks`);
      return finalQueue;
      
    } catch (error) {
      console.error('Error generating smart queue:', error);
      return [];
    }
  }

  /**
   * Ajoute des recommandations à une file d'attente existante
   */
  public async addToQueue(currentQueue: Track[], additionalCount: number = 10): Promise<Track[]> {
    if (currentQueue.length === 0) {
      return [];
    }

    // Utiliser la dernière musique comme graine
    const lastTrack = currentQueue[currentQueue.length - 1];
    const newRecommendations = await this.generateSmartQueue(lastTrack, additionalCount);
    
    return [...currentQueue, ...newRecommendations];
  }

  /**
   * Récupère les caractéristiques audio d'une musique
   */
  private async getTrackFeatures(track: Track): Promise<TrackFeatures> {
    const cacheKey = track.id;
    
    if (this.trackFeaturesCache.has(cacheKey)) {
      return this.trackFeaturesCache.get(cacheKey)!;
    }

    try {
      // Récupérer les features audio depuis Spotify
      const audioFeatures = await this.spotifyService.getAudioFeatures(track.id);
      const trackAnalysis = await this.spotifyService.getTrackAnalysis(track.id);
      
      // Récupérer les genres des artistes
      const artistInfo = await this.spotifyService.getArtist(track.artists[0].id);
      
      const features: TrackFeatures = {
        danceability: audioFeatures.danceability,
        energy: audioFeatures.energy,
        valence: audioFeatures.valence, // Positivité de la musique
        acousticness: audioFeatures.acousticness,
        instrumentalness: audioFeatures.instrumentalness,
        tempo: audioFeatures.tempo,
        genres: artistInfo.genres || [],
        artists: track.artists.map(a => a.name)
      };

      this.trackFeaturesCache.set(cacheKey, features);
      return features;
      
    } catch (error) {
      console.error('Error getting track features:', error);
      
      // Valeurs par défaut si erreur
      return {
        danceability: 0.5,
        energy: 0.5,
        valence: 0.5,
        acousticness: 0.5,
        instrumentalness: 0.5,
        tempo: 120,
        genres: [],
        artists: track.artists.map(a => a.name)
      };
    }
  }

  /**
   * Récupère les recommandations depuis l'API Spotify
   */
  private async getSpotifyRecommendations(seedTrack: Track, limit: number): Promise<Track[]> {
    try {
      const recommendations = await this.spotifyService.getRecommendations({
        seed_tracks: [seedTrack.id],
        limit: limit,
        target_energy: undefined,
        target_danceability: undefined,
        target_valence: undefined
      });
      
      return recommendations.tracks;
      
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error);
      return [];
    }
  }

  /**
   * Score chaque recommandation selon différents critères
   */
  private async scoreRecommendations(tracks: Track[], seedFeatures: TrackFeatures, seedTrack: Track): Promise<RecommendationScore[]> {
    const scores: RecommendationScore[] = [];

    for (const track of tracks) {
      // Éviter les doublons et le même artiste
      if (track.id === seedTrack.id || track.artists.some(a => seedFeatures.artists.includes(a.name))) {
        continue;
      }

      const trackFeatures = await this.getTrackFeatures(track);
      const score = await this.calculateTrackScore(trackFeatures, seedFeatures, seedTrack);
      
      scores.push({
        track,
        score: score.score,
        reason: score.reason
      });
    }

    // Trier par score décroissant
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Calcule le score de compatibilité entre deux musiques
   */
  private async calculateTrackScore(trackFeatures: TrackFeatures, seedFeatures: TrackFeatures, seedTrack: Track): Promise<{ score: number; reason: 'similar_genre' | 'similar_mood' | 'discovery' | 'artist_collaboration' }> {
    let score = 0;
    let reason: 'similar_genre' | 'similar_mood' | 'discovery' | 'artist_collaboration' = 'similar_genre';

    // 1. Similarité des genres (poids: 40%)
    const genreSimilarity = this.calculateGenreSimilarity(trackFeatures.genres, seedFeatures.genres);
    score += genreSimilarity * 0.4;

    // 2. Similarité de l'humeur/énergie (poids: 30%)
    const moodSimilarity = this.calculateMoodSimilarity(trackFeatures, seedFeatures);
    score += moodSimilarity * 0.3;

    // 3. Similarité rythmique (poids: 20%)
    const tempoSimilarity = this.calculateTempoSimilarity(trackFeatures.tempo, seedFeatures.tempo);
    score += tempoSimilarity * 0.2;

    // 4. Facteur découverte (poids: 10%)
    const discoveryFactor = this.calculateDiscoveryFactor(trackFeatures, seedFeatures);
    score += discoveryFactor * 0.1;

    // Bonus pour les collaborations d'artistes similaires
    if (this.hasArtistCollaboration(trackFeatures.artists, seedFeatures.artists)) {
      score += 0.15;
      reason = 'artist_collaboration' as const;
    }

    // Déterminer la raison principale
    if (discoveryFactor > 0.7) {
      reason = 'discovery' as const;
    } else if (moodSimilarity > 0.8) {
      reason = 'similar_mood' as const;
    } else if (genreSimilarity > 0.7) {
      reason = 'similar_genre' as const;
    }

    return { score, reason };
  }

  /**
   * Calcule la similarité entre les genres
   */
  private calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
    if (genres1.length === 0 || genres2.length === 0) {
      return 0.3; // Score par défaut si pas de genres
    }

    const commonGenres = genres1.filter(g => genres2.includes(g));
    const totalGenres = new Set([...genres1, ...genres2]).size;
    
    return commonGenres.length / totalGenres;
  }

  /**
   * Calcule la similarité d'humeur (énergie, valence, danceabilité)
   */
  private calculateMoodSimilarity(features1: TrackFeatures, features2: TrackFeatures): number {
    const energyDiff = Math.abs(features1.energy - features2.energy);
    const valenceDiff = Math.abs(features1.valence - features2.valence);
    const danceabilityDiff = Math.abs(features1.danceability - features2.danceability);
    
    // Plus la différence est petite, plus la similarité est élevée
    const avgDiff = (energyDiff + valenceDiff + danceabilityDiff) / 3;
    return 1 - avgDiff;
  }

  /**
   * Calcule la similarité de tempo
   */
  private calculateTempoSimilarity(tempo1: number, tempo2: number): number {
    const diff = Math.abs(tempo1 - tempo2);
    const maxDiff = Math.max(tempo1, tempo2);
    
    if (maxDiff === 0) return 1;
    
    // Permettre une différence de tempo jusqu'à 20 BPM
    const normalizedDiff = Math.min(diff / 20, 1);
    return 1 - normalizedDiff;
  }

  /**
   * Calcule le facteur de découverte (plus c'est différent, plus c'est élevé)
   */
  private calculateDiscoveryFactor(features1: TrackFeatures, features2: TrackFeatures): number {
    const genreDiff = 1 - this.calculateGenreSimilarity(features1.genres, features2.genres);
    const moodDiff = 1 - this.calculateMoodSimilarity(features1, features2);
    
    // Facteur de découverte basé sur la différence mais pas trop extrême
    const discoveryScore = (genreDiff + moodDiff) / 2;
    
    // Normaliser entre 0 et 1, avec un pic autour de 0.3-0.7 de différence
    return discoveryScore > 0.8 ? 0.3 : discoveryScore;
  }

  /**
   * Vérifie s'il y a une collaboration d'artistes
   */
  private hasArtistCollaboration(artists1: string[], artists2: string[]): boolean {
    // Vérifier si les artistes ont déjà collaboré (simplifié)
    // Dans une vraie implémentation, on pourrait vérifier les features collaboratives
    return false;
  }

  /**
   * Sélectionne une file d'attente équilibrée
   */
  private selectBalancedQueue(scoredRecommendations: RecommendationScore[], targetSize: number): Track[] {
    const queue: Track[] = [];
    const similarCount = Math.floor(targetSize * 0.7); // 70% similaires
    const discoveryCount = targetSize - similarCount; // 30% découvertes

    // Séparer les recommandations par type
    const similar = scoredRecommendations.filter(r => r.reason !== 'discovery');
    const discoveries = scoredRecommendations.filter(r => r.reason === 'discovery');

    // Ajouter les musiques similaires
    for (let i = 0; i < Math.min(similarCount, similar.length); i++) {
      queue.push(similar[i].track);
    }

    // Ajouter les découvertes
    for (let i = 0; i < Math.min(discoveryCount, discoveries.length); i++) {
      queue.push(discoveries[i].track);
    }

    // Compléter avec les meilleurs scores restants si nécessaire
    const remaining = scoredRecommendations.filter(r => !queue.includes(r.track));
    while (queue.length < targetSize && remaining.length > 0) {
      queue.push(remaining.shift()!.track);
    }

    return queue;
  }

  /**
   * Nettoie le cache des features
   */
  public clearCache(): void {
    this.trackFeaturesCache.clear();
  }

  /**
   * Obtient des statistiques sur la file d'attente générée
   */
  public getQueueStats(queue: Track[]): { totalTracks: number; avgEnergy: number; avgTempo: number; genreDistribution: Record<string, number> } {
    if (queue.length === 0) {
      return { totalTracks: 0, avgEnergy: 0, avgTempo: 0, genreDistribution: {} };
    }

    let totalEnergy = 0;
    let totalTempo = 0;
    const genreCount: Record<string, number> = {};

    queue.forEach(track => {
      const features = this.trackFeaturesCache.get(track.id);
      if (features) {
        totalEnergy += features.energy;
        totalTempo += features.tempo;
        
        features.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });

    return {
      totalTracks: queue.length,
      avgEnergy: totalEnergy / queue.length,
      avgTempo: totalTempo / queue.length,
      genreDistribution: genreCount
    };
  }
}
