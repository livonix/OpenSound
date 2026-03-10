import React from 'react';
import { Clock, Download } from 'lucide-react';
import { usePlaylist } from '../../contexts/PlaylistContext';

export const LibraryPage: React.FC = () => {
  const { playlists } = usePlaylist();

  const recentTracks = [
    {
      id: 1,
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      duration: '5:55',
      image: 'https://via.placeholder.com/48/1DB954/FFFFFF?text=♪'
    },
    {
      id: 2,
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      album: 'Led Zeppelin IV',
      duration: '8:02',
      image: 'https://via.placeholder.com/48/1DB954/FFFFFF?text=♪'
    },
    {
      id: 3,
      title: 'Hotel California',
      artist: 'Eagles',
      album: 'Hotel California',
      duration: '6:30',
      image: 'https://via.placeholder.com/48/1DB954/FFFFFF?text=♪'
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Votre Bibliothèque</h1>
        
        <div className="flex space-x-4 mb-8">
          <button className="px-6 py-2 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-all">
            Playlists
          </button>
          <button className="px-6 py-2 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-all">
            Artistes
          </button>
          <button className="px-6 py-2 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-all">
            Albums
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-900 bg-opacity-50 rounded-lg p-4 hover:bg-opacity-80 transition-all cursor-pointer group"
            >
              <div className="mb-4 relative">
                <img
                  src={playlist.image || playlist.coverImage || 'https://via.placeholder.com/300/1DB954/FFFFFF?text=Playlist'}
                  alt={playlist.name}
                  className="w-full aspect-square rounded-lg shadow-lg"
                />
                <button className="absolute bottom-2 right-2 bg-spotify-green text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105 shadow-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <h3 className="font-semibold text-white mb-1">{playlist.name}</h3>
              <p className="text-sm text-gray-300">{playlist.tracks?.length || 0} titres</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Écoutes récentes</h2>
          <button className="text-gray-300 hover:text-white transition-colors">
            <Clock size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {recentTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center space-x-4 px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors duration-200 group"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src={track.image}
                  alt={track.title}
                  className="w-full h-full rounded"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{track.title}</h3>
                <p className="text-sm text-gray-300 truncate">{track.artist}</p>
              </div>

              <div className="hidden lg:block flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">{track.album}</p>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">{track.duration}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={16} className="text-gray-300 hover:text-white" />
                </button>
              </div>

              <button className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
