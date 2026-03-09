import React from 'react';
import { 
  Play, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Repeat, 
  Shuffle,
  Heart,
  Mic2,
  List,
  MonitorSpeaker,
  Maximize2
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

export const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlayPause,
    setVolumeLevel,
    seek,
    skip
  } = usePlayer();

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    seek(newProgress);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolumeLevel(newVolume);
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center space-x-4 w-1/3">
          <img
            src={currentTrack.artworkUrl || 'https://via.placeholder.com/56/1DB954/FFFFFF?text=♪'}
            alt={currentTrack.title}
            className="w-14 h-14 rounded"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-gray-300 truncate">
              {currentTrack.author}
            </p>
          </div>
          <button className="text-gray-300 hover:text-white transition-colors">
            <Heart size={16} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center max-w-xl w-1/3">
          <div className="flex items-center space-x-4 mb-2">
            <button className="text-gray-300 hover:text-white transition-colors">
              <Shuffle size={18} />
            </button>
            <button className="text-gray-300 hover:text-white transition-colors">
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlayPause}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <Play size={20} fill="black" />
              )}
            </button>
            <button 
              onClick={skip}
              className="text-gray-300 hover:text-white transition-colors"
              title="Skip to next recommendation"
            >
              <SkipForward size={20} />
            </button>
            <button className="text-gray-300 hover:text-white transition-colors">
              <Repeat size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-gray-300 w-10 text-right">
              {formatTime(progress)}
            </span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max={duration}
                value={progress}
                onChange={handleProgressChange}
                className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, white ${progressPercentage}%, #4B5563 ${progressPercentage}%)`
                }}
              />
            </div>
            <span className="text-xs text-gray-300 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume and Controls */}
        <div className="flex items-center justify-end space-x-4 w-1/3">
          <button className="text-gray-300 hover:text-white transition-colors">
            <Mic2 size={18} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors">
            <List size={18} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors">
            <MonitorSpeaker size={18} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors">
            <Maximize2 size={18} />
          </button>
          
          <div className="flex items-center space-x-2">
            <Volume2 size={18} className="text-gray-300" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${volume}%, #4B5563 ${volume}%)`
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};
