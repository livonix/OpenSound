import React from 'react';
import { Play, MoreHorizontal } from 'lucide-react';
import { Track } from '../types/music';

interface TrackItemProps {
  track: Track;
  onPlay: (track: Track) => void;
  showArtist?: boolean;
  showDuration?: boolean;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  onPlay,
  showArtist = true,
  showDuration = true,
}) => {
  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="track-item group">
      <div className="w-12 h-12 flex items-center justify-center">
        <img
          src={track.artworkUrl || 'https://via.placeholder.com/48/1DB954/FFFFFF?text=♪'}
          alt={track.title}
          className="w-full h-full rounded"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{track.title}</h3>
        {showArtist && (
          <p className="text-sm text-gray-300 truncate">{track.author}</p>
        )}
      </div>

      {showDuration && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            {formatDuration(track.duration)}
          </span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={16} className="text-gray-300 hover:text-white" />
          </button>
        </div>
      )}

      <button
        onClick={() => onPlay(track)}
        className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-lg"
      >
        <Play size={14} fill="black" />
      </button>
    </div>
  );
};
