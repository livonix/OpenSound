import React from 'react';
import { Heart } from 'lucide-react';
import { Track } from '../../../shared/types';

interface HeartButtonSimpleProps {
  track: Track;
  size?: number;
  className?: string;
  showText?: boolean;
  isLiked: boolean;
  onToggleLike: (track: Track) => void;
  isLoading?: boolean;
}

export function HeartButtonSimple({ 
  track, 
  size = 20, 
  className = '', 
  showText = false, 
  isLiked, 
  onToggleLike, 
  isLoading = false 
}: HeartButtonSimpleProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent track selection when clicking heart
    if (isLoading) return;
    onToggleLike(track);
  };

  return (
    <button
      onClick={handleClick}
      className={`heart-button transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'} ${className}`}
      title={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
      disabled={isLoading}
      style={{ border: 'none', background: 'transparent' }}
    >
      <Heart
        size={size}
        className={`
          transition-colors duration-200
          ${isLiked 
            ? 'fill-spotify-green text-spotify-green' 
            : 'text-spotify-gray hover:text-white'
          }
        `}
      />
      {showText && (
        <span className="ml-2 text-sm">
          {isLiked ? 'Liked' : 'Like'}
        </span>
      )}
    </button>
  );
}
