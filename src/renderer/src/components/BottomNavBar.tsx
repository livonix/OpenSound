import React from 'react';
import { Track } from '../../../shared/types';

interface BottomNavBarProps {
  currentTrack?: Track | null;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTrack = null,
  isPlaying = false,
  currentTime = 102, // 1:42 in seconds
  duration = 243, // 4:03 in seconds
  volume = 0.7,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onShuffle,
  onRepeat
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercentage = volume * 100;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onVolumeChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onVolumeChange(percentage);
  };

  // Get display values from Track object
  const trackTitle = currentTrack?.name || "Midnight City";
  const trackArtist = currentTrack?.artists?.[0]?.name || "M83";
  const trackAlbumArt = currentTrack?.album?.images?.[0]?.url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAU8SPetzvb_8GI382p1tjpSV5GeChI9-gE-3QPIQZ6lra2BDE0V2ydmHGWFmf8wGErLmD9_5WZpWZHKgkHa0IqaRP2zoEvk7JLVFLYmpk_43St3RF8TnPNC2vnOSh7Tc533LK_Byy-Mzg_avGGIzLTSdmqmL3F0kf9GKch6vLd8EyZy7JrHfs1uB1wCyC4O9YKbRoUAphkLD8q438ZHZpDykH_YWigja1T4VV_79P3Dnl0_ZpaaiFI3ete8oTuYuelUXk0JOARxQ";

  return (
    <footer className="fixed bottom-0 left-0 w-full h-24 z-50 bg-neutral-900/80 dark:bg-surface-container/90 backdrop-blur-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex justify-between items-center px-6">
      {/* Current Track */}
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg">
          <img
            alt="Now playing album art"
            className="w-full h-full object-cover"
            src={trackAlbumArt}
          />
        </div>
        <div className="overflow-hidden">
          <p className="font-headline font-bold text-sm truncate">{trackTitle}</p>
          <p className="text-on-surface-variant text-xs font-label truncate hover:underline cursor-pointer">
            {trackArtist}
          </p>
        </div>
        <button className="text-on-surface-variant hover:text-primary transition-colors ml-2">
          <span className="material-symbols-outlined text-xl">favorite</span>
        </button>
      </div>

      {/* Controls & Scrubber */}
      <div className="flex flex-col items-center gap-3 w-2/4">
        {/* Playback Controls */}
        <div className="flex items-center gap-8">
          <button 
            className="text-neutral-400 dark:text-on-surface-variant hover:scale-105 transition-transform" 
            title="Shuffle"
            onClick={onShuffle}
          >
            <span className="material-symbols-outlined">shuffle</span>
          </button>
          <button 
            className="text-neutral-400 dark:text-on-surface-variant hover:scale-105 transition-transform" 
            title="Back"
            onClick={onPrevious}
          >
            <span className="material-symbols-outlined">skip_previous</span>
          </button>
          <button 
            className="text-primary scale-110 hover:scale-125 transition-transform" 
            title="Play"
            onClick={onPlayPause}
          >
            <span 
              className="material-symbols-outlined text-5xl" 
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </button>
          <button 
            className="text-neutral-400 dark:text-on-surface-variant hover:scale-105 transition-transform" 
            title="Next"
            onClick={onNext}
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>
          <button 
            className="text-neutral-400 dark:text-on-surface-variant hover:scale-105 transition-transform" 
            title="Repeat"
            onClick={onRepeat}
          >
            <span className="material-symbols-outlined">repeat</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
            {formatTime(currentTime)}
          </span>
          <div 
            className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden group cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full premium-gradient rounded-full relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
          <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="flex items-center justify-end gap-4 w-1/4">
        <button className="text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined">lyrics</span>
        </button>
        <button className="text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined">queue_music</span>
        </button>
        <div className="flex items-center gap-2 group w-32">
          <span className="material-symbols-outlined text-on-surface-variant">volume_up</span>
          <div 
            className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden cursor-pointer"
            onClick={handleVolumeClick}
          >
            <div 
              className="h-full bg-on-surface-variant group-hover:bg-primary transition-colors rounded-full"
              style={{ width: `${volumePercentage}%` }}
            ></div>
          </div>
        </div>
        <button className="text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
      </div>
    </footer>
  );
};

export default BottomNavBar;
