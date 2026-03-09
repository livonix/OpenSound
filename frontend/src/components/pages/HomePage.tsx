import React from 'react';
import { Play, Shuffle, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';

export const HomePage: React.FC = () => {
  const { currentTrack, isPlaying, togglePlayPause } = usePlayer();

  const featuredPlaylists = [
    {
      id: 1,
      title: 'Découvertes de la semaine',
      description: 'Vos recommandations personnalisées',
      image: 'https://via.placeholder.com/300/1DB954/FFFFFF?text=Découvertes'
    },
    {
      id: 2,
      title: 'Hits du moment',
      description: 'Les titres les plus populaires',
      image: 'https://via.placeholder.com/300/E8115B/FFFFFF?text=Hits'
    },
    {
      id: 3,
      title: 'Focus Jazz',
      description: 'Le meilleur du jazz',
      image: 'https://via.placeholder.com/300/1E3264/FFFFFF?text=Jazz'
    },
    {
      id: 4,
      title: 'Focus Rock',
      description: 'Le meilleur du rock',
      image: 'https://via.placeholder.com/300/E8115B/FFFFFF?text=Rock'
    },
  ];

  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">Bonsoir</h1>
        
        {currentTrack && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-6">
              <img
                src={currentTrack.artworkUrl || 'https://via.placeholder.com/100/1DB954/FFFFFF?text=Track'}
                alt={currentTrack.title}
                className="w-24 h-24 rounded-lg shadow-lg"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{currentTrack.title}</h2>
                <p className="text-gray-300 mb-4">{currentTrack.author}</p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePlayPause}
                    className="bg-spotify-green text-black p-3 rounded-full hover:bg-spotify-green-hover transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <Play size={24} fill="black" />
                    )}
                  </button>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    <SkipBack size={20} />
                  </button>
                  <button className="text-gray-300 hover:text-white transition-colors">
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-900 bg-opacity-50 rounded-lg p-4 hover:bg-opacity-80 transition-all cursor-pointer group"
            >
              <div className="mb-4 relative">
                <img
                  src={playlist.image}
                  alt={playlist.title}
                  className="w-full aspect-square rounded-lg shadow-lg"
                />
                <button className="absolute bottom-2 right-2 bg-spotify-green text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105 shadow-lg">
                  <Play size={16} fill="black" />
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1">{playlist.title}</h3>
              <p className="text-sm text-gray-300">{playlist.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
