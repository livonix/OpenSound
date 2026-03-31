import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Repeat, 
  Shuffle,
  Heart,
  PictureInPicture
} from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';
import { audioPlayer } from '../services/audioPlayer';

export function Player() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    buffered,
    setPlaying,
    setVolume,
    setCurrentTime,
  } = usePlayerStore();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handlePlayPause = async () => {
    if (!currentTrack) return;

    try {
      if (isPlaying) {
        audioPlayer.pause();
        setPlaying(false);
      } else {
        if (currentTime === 0) {
          await audioPlayer.playTrack(currentTrack);
        } else {
          audioPlayer.resume();
        }
        setPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    setCurrentTime(newTime);
    audioPlayer.seek(newTime);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    setCurrentTime(newTime);
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    setVolume(newVolume);
    audioPlayer.setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleNext = async () => {
    try {
      await audioPlayer.next();
    } catch (error) {
      console.error('Next track error:', error);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

  if (!currentTrack) return null;

  return (
    <div className="h-full flex items-center justify-between px-4">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        {currentTrack.album?.images?.[0] && (
          <img
            src={currentTrack.album.images[0].url}
            alt={currentTrack.name}
            className="w-14 h-14 rounded"
          />
        )}
        
        <div className="min-w-0">
          <h4 className="text-sm font-medium truncate hover:text-spotify-gray cursor-pointer">
            {currentTrack.name}
          </h4>
          <p className="text-xs text-spotify-gray truncate">
            {currentTrack.artists.map((a: any) => a.name).join(', ')}
          </p>
        </div>

        <button className="text-spotify-gray hover:text-white transition-colors">
          <Heart size={18} />
        </button>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 w-1/3">
        <div className="flex items-center gap-4">
          <button className="text-spotify-gray hover:text-white transition-colors">
            <Shuffle size={18} />
          </button>
          
          <button className="text-spotify-gray hover:text-white transition-colors">
            <SkipBack size={18} />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button onClick={handleNext} className="text-spotify-gray hover:text-white transition-colors">
            <SkipForward size={18} />
          </button>
          
          <button className="text-spotify-gray hover:text-white transition-colors">
            <Repeat size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-spotify-gray min-w-[40px] text-right">
            {formatTime(currentTime)}
          </span>
          
          <div
            ref={progressBarRef}
            className="progress-bar flex-1 relative"
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleProgressDrag}
          >
            {/* Buffered progress */}
            <div
              className="absolute h-full bg-spotify-gray rounded-full"
              style={{ width: `${bufferedPercentage}%` }}
            />
            
            {/* Current progress */}
            <div
              className="progress-bar-fill absolute"
              style={{ width: `${progressPercentage}%` }}
            />
            
            {/* Progress handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"
              style={{ left: `${progressPercentage}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          
          <span className="text-xs text-spotify-gray min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center gap-2 justify-end w-1/3">
        <button className="text-spotify-gray hover:text-white transition-colors">
          <PictureInPicture size={18} />
        </button>
        
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-spotify-gray" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localVolume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
}
