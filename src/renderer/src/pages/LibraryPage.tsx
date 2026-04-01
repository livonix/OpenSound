import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { Playlist } from '../../../shared/types';

const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('playlists');
  const { playlists, userPlaylists, isLoading: userDataLoading } = useUserData();

  const tabs = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' },
    { id: 'podcasts', label: 'Podcasts' }
  ];

  // Combine user playlists for display, avoiding duplicates
  const allPlaylists: Playlist[] = [
    ...(userPlaylists || []),
    ...(playlists || [])
  ];

  // Remove duplicates by ID
  const uniquePlaylists = allPlaylists.filter((playlist, index, self) => 
    index === self.findIndex((p) => p.id === playlist.id)
  );

  const isLoading = userDataLoading;

  console.log('🎵 LibraryPage Debug:', {
    activeTab,
    isLoading,
    userDataLoading,
    playlistsCount: playlists?.length || 0,
    userPlaylistsCount: userPlaylists?.length || 0,
    allPlaylistsCount: uniquePlaylists.length
  });

  const getPlaylistCoverArt = (playlist: Playlist) => {
    // For playlists with tracks, use the first track's album art
    if (playlist.tracks && playlist.tracks.length > 0) {
      const firstTrack = playlist.tracks[0];
      return firstTrack.album?.images?.[0]?.url || 'https://via.placeholder.com/300';
    }
    
    // Default placeholder
    return 'https://via.placeholder.com/300';
  };

  const getTrackCount = (playlist: Playlist) => {
    return playlist.tracks?.length || 0;
  };

  return (
    <main className="ml-64 pt-24 pb-32 px-10 min-h-screen bg-background">
      {/* Editorial Header Section */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-6xl font-extrabold font-headline tracking-tighter text-white mb-2">Library</h2>
            <p className="text-on-surface-variant font-label tracking-widest uppercase text-xs">
              Curated by you • {uniquePlaylists.length} items
            </p>
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="flex items-center space-x-8 mb-12 border-b border-outline-variant/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-lg font-bold font-headline relative transition-colors ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute -bottom-4 left-0 w-full h-0.5 bg-primary"></span>
              )}
            </button>
          ))}
        </div>

        {/* Bento Grid for Library */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {isLoading ? (
            // Loading skeleton
            [...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-surface-container mb-4"></div>
                <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
              </div>
            ))
          ) : activeTab === 'playlists' ? (
            // Actual playlists
            uniquePlaylists.map((playlist) => (
              <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="group cursor-pointer block">
                <div className="aspect-square rounded-xl overflow-hidden bg-surface-container mb-4 relative">
                  <img
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      src={getPlaylistCoverArt(playlist)}
                    />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="w-12 h-12 sonic-gradient rounded-full flex items-center justify-center">
                      <span 
                        className="material-symbols-outlined text-on-primary-fixed"
                        style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                      >
                        play_arrow
                      </span>
                    </button>
                  </div>
                </div>
                
                <h4 className="font-bold font-headline text-white truncate">{playlist.name}</h4>
                <p className="text-xs text-on-surface-variant font-label mt-1">
                  Playlist • {getTrackCount(playlist)} tracks
                </p>
              </Link>
            ))
          ) : (
            // Empty state for other tabs
            <div className="col-span-full text-center py-12">
              <div className="text-on-surface-variant mb-4">
                <span 
                  className="material-symbols-outlined text-6xl"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  {activeTab === 'albums' ? 'album' : activeTab === 'artists' ? 'person' : 'podcasts'}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2 capitalize">{activeTab} coming soon</h3>
              <p className="text-on-surface-variant">
                This section is under development
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default LibraryPage;
