import React, { useEffect, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { Track } from '../../../shared/types';
import { useLikedSongs } from '../hooks/useLikedSongs';

interface HeartButtonProps {
  track: Track;
  size?: number;
  className?: string;
  showText?: boolean;
}

export function HeartButton({ track, size = 20, className = '', showText = false }: HeartButtonProps) {
  const { isTrackLiked, toggleLikeTrack } = useLikedSongs();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkLikedStatus = async () => {
      if (!isMounted) return;
      try {
        const liked = await isTrackLiked(track.id);
        if (isMounted) {
          setIsLiked(liked);
        }
      } catch (error) {
        console.error('❌ Error checking liked status:', error);
      }
    };
    
    checkLikedStatus();
    
    return () => {
      isMounted = false;
    };
  }, [track.id, isTrackLiked]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent track selection when clicking heart
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newLikedState = await toggleLikeTrack(track);
      setIsLiked(newLikedState);
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
    } finally {
      setIsLoading(false);
    }
  }, [track, isLoading, toggleLikeTrack]);

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
