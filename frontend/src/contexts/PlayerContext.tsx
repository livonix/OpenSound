import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { PlayerState, Track } from '../types/music';
import { playTrack, pauseTrack, stopTrack, setVolume, seekTrack, skipTrack, trackSearch, getAudioStream } from '../services/api';

interface PlayerContextType {
  playerState: PlayerState;
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  play: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  setVolumeLevel: (volume: number) => Promise<void>;
  seek: (position: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skip: () => Promise<void>;
  trackUserSearch: (query: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: false,
    volume: 100,
    position: 0,
  });
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio();
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleTrackEnd);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.pause();
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current && currentTrack) {
      setPlayerState(prev => ({ ...prev, position: audioRef.current!.currentTime * 1000 }));
    }
  };

  const handleTrackEnd = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }));
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && currentTrack) {
      setPlayerState(prev => ({ ...prev, position: 0 }));
    }
  };

  const play = async (track: Track) => {
    try {
      console.log('🎵 Playing track:', { title: track.title, uri: track.uri });
      
      // Clear any existing interval
      if ((window as any).currentProgressInterval) {
        clearInterval((window as any).currentProgressInterval);
      }
      
      setCurrentTrack(track);
      setPlayerState(prev => ({ ...prev, isPlaying: true, isPaused: false, position: 0 }));
      
      try {
        console.log('🔄 Starting audio streaming...');
        
        if (audioRef.current) {
          // Check if we're in Electron mode
          const isElectron = (window as any).config?.IS_ELECTRON || false;
          
          let streamUrl: string;
          
          if (isElectron) {
            // Mode Electron : utiliser Lavalink directement
            console.log('🎧 Using Lavalink direct streaming (Electron mode)');
            const streamData = await getAudioStream(track.encoded);
            streamUrl = streamData.streamUrl;
          } else {
            // Mode Web : utiliser le proxy du backend
            console.log('🌐 Using backend proxy (Web mode)');
            streamUrl = `http://localhost:3001/api/player/audio-proxy/${track.encoded}`;
          }
          
          console.log('🔗 Using stream URL:', streamUrl);
          
          audioRef.current.src = streamUrl;
          audioRef.current.preload = 'auto';
          audioRef.current.volume = playerState.volume / 100;
          audioRef.current.crossOrigin = 'anonymous';
          
          try {
            await audioRef.current.play();
            console.log('✅ Audio streaming started!');
            
            // Start real progress tracking
            const timeUpdateHandler = () => {
              if (audioRef.current) {
                setPlayerState(prev => ({ 
                  ...prev, 
                  position: audioRef.current!.currentTime * 1000 
                }));
              }
            };
            
            audioRef.current.addEventListener('timeupdate', timeUpdateHandler);
            audioRef.current.addEventListener('ended', () => {
              console.log('🏁 Track ended');
              setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }));
            });
            
          } catch (playError) {
            console.log('❌ Audio play failed, falling back to simulation:', playError);
            fallbackToSimulation(track);
          }
        } else {
          console.log('❌ No audio element, using simulation');
          fallbackToSimulation(track);
        }
      } catch (streamError) {
        console.log('❌ Stream setup failed, using simulation:', streamError);
        fallbackToSimulation(track);
      }
      
      // Also call backend for state management (only in web mode)
      if (!(window as any).config?.IS_ELECTRON) {
        await playTrack(track.encoded);
      }
      
    } catch (error) {
      console.error('Error playing track:', error);
      fallbackToSimulation(track);
    }
  };

  const fallbackToSimulation = (track: Track) => {
    console.log('🔄 Using simulated playback with real timing');
    
    // Start progress simulation for better UX
    const simulateProgress = () => {
      setPlayerState(prev => {
        if (!prev.isPlaying || prev.isPaused) return prev;
        
        const newPosition = prev.position + 1000;
        if (newPosition >= track.duration) {
          return { ...prev, isPlaying: false, isPaused: false, position: 0 };
        }
        return { ...prev, position: newPosition };
      });
    };
    
    // Update progress every second
    const progressInterval = setInterval(simulateProgress, 1000);
    (window as any).currentProgressInterval = progressInterval;
    
    console.log(`🎵 Now playing: ${track.title}`);
    console.log('📺 Stream URL:', track.uri);
    console.log('💡 Audio stream unavailable - using simulated timing');
  };

  const pause = async () => {
    try {
      // Clear progress interval
      if ((window as any).currentProgressInterval) {
        clearInterval((window as any).currentProgressInterval);
        (window as any).currentProgressInterval = null;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Only call backend in web mode
      if (!(window as any).config?.IS_ELECTRON) {
        await pauseTrack();
      }
      
      setPlayerState(prev => ({ ...prev, isPaused: true }));
      console.log('⏸️ Track paused');
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  };

  const stop = async () => {
    try {
      // Clear progress interval
      if ((window as any).currentProgressInterval) {
        clearInterval((window as any).currentProgressInterval);
        (window as any).currentProgressInterval = null;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Only call backend in web mode
      if (!(window as any).config?.IS_ELECTRON) {
        await stopTrack();
      }
      
      setCurrentTrack(null);
      setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: false, position: 0 }));
      console.log('⏹️ Track stopped');
    } catch (error) {
      console.error('Error stopping track:', error);
    }
  };

  const setVolumeLevel = async (volume: number) => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = volume / 100;
      }
      
      // Only call backend in web mode
      if (!(window as any).config?.IS_ELECTRON) {
        await setVolume(volume);
      }
      
      setPlayerState(prev => ({ ...prev, volume }));
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  const seek = async (position: number) => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = position / 1000;
      }
      
      // Only call backend in web mode
      if (!(window as any).config?.IS_ELECTRON) {
        await seekTrack(position);
      }
      
      setPlayerState(prev => ({ ...prev, position }));
    } catch (error) {
      console.error('Error seeking track:', error);
    }
  };

  const resume = async () => {
    try {
      if (audioRef.current && audioRef.current.src) {
        // Resume existing audio element
        await audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPaused: false }));
        console.log('▶️ Track resumed');
      } else {
        // Fallback to play if no audio source
        await play(currentTrack!);
      }
    } catch (error) {
      console.error('Error resuming track:', error);
      // Fallback to play if resume fails
      await play(currentTrack!);
    }
  };

  const togglePlayPause = async () => {
    if (!currentTrack) return;

    if (playerState.isPlaying && !playerState.isPaused) {
      await pause();
    } else {
      await resume();
    }
  };

  const skip = async () => {
    try {
      if (!currentTrack) return;
      
      console.log('⏭️ Skipping track:', currentTrack.title);
      
      // Get current position for learning
      const currentPosition = playerState.position;
      
      // Call skip API with recommendation (only in web mode for now)
      if (!(window as any).config?.IS_ELECTRON) {
        const result = await skipTrack(currentTrack, currentPosition);
        
        if (result.success && result.recommendation) {
          console.log('🎵 Playing recommended track:', result.recommendation.title);
          
          // Play the recommended track
          await play(result.recommendation);
        } else {
          console.log('❌ No recommendation available');
          // Stop current track as fallback
          await stop();
        }
      } else {
        console.log('⏭️ Skip not implemented in Electron mode yet');
        await stop();
      }
    } catch (error) {
      console.error('Error skipping track:', error);
    }
  };

  const trackUserSearch = async (query: string) => {
    try {
      // Only track search in web mode
      if (!(window as any).config?.IS_ELECTRON) {
        await trackSearch(query);
      }
      console.log('🔍 Search tracked for recommendations:', query);
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  const value = {
    playerState,
    currentTrack,
    isPlaying: playerState.isPlaying && !playerState.isPaused,
    volume: playerState.volume,
    progress: playerState.position,
    duration: currentTrack?.duration || 0,
    play,
    pause,
    stop,
    setVolumeLevel,
    seek,
    togglePlayPause,
    skip,
    trackUserSearch,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};
