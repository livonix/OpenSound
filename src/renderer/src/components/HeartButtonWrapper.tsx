import React from 'react';
import { HeartButtonSimple } from './HeartButtonSimple';
import { Track } from '../../../shared/types';
import { useLikedSongs } from '../hooks/useLikedSongs';

interface HeartButtonWrapperProps {
  track: Track;
  size?: number;
  className?: string;
  showText?: boolean;
}

export function HeartButtonWrapper({ track, size = 20, className = '', showText = false }: HeartButtonWrapperProps) {
  const { isTrackLiked, toggleLikeTrack } = useLikedSongs();
  const [isLiked, setIsLiked] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
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

  const handleToggleLike = async (trackToToggle: Track) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newLikedState = await toggleLikeTrack(trackToToggle);
      setIsLiked(newLikedState);
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HeartButtonSimple
      track={track}
      size={size}
      className={className}
      showText={showText}
      isLiked={isLiked}
      onToggleLike={handleToggleLike}
      isLoading={isLoading}
    />
  );
}
