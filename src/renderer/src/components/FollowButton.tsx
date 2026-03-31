import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Artist } from '../../../shared/types';
import { useFollowedArtists } from '../hooks/useFollowedArtists';

interface FollowButtonProps {
  artist: Artist;
  size?: number;
  className?: string;
}

export function FollowButton({ artist, size = 16, className = '' }: FollowButtonProps) {
  const { toggleFollowArtist, isFollowingArtist } = useFollowedArtists();
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const checkFollowing = async () => {
      const following = await isFollowingArtist(artist.id);
      setIsFollowing(following);
    };
    checkFollowing();
  }, [artist.id, isFollowingArtist]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const newFollowingState = await toggleFollowArtist(artist);
      setIsFollowing(newFollowingState);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`text-spotify-gray hover:text-white transition-colors ${className}`}
      title={isFollowing ? 'Unfollow' : 'Follow'}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : isFollowing ? (
        <UserCheck size={size} fill="currentColor" />
      ) : (
        <UserPlus size={size} />
      )}
    </button>
  );
}
