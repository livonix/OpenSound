import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useUserData } from '../hooks/useUserData';
import { Playlist } from '../../../shared/types';

const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('playlists');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { playlists, userPlaylists, isLoading: userDataLoading, createPlaylist } = useUserData();

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

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    setIsCreating(true);
    try {
      await createPlaylist(newPlaylistName.trim());
      setShowCreatePlaylist(false);
      setNewPlaylistName('');
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="ml-64 pt-24 pb-32 px-10 min-h-screen bg-background">
      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md border border-outline-variant/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold font-headline text-white">Create Playlist</h3>
              <button 
                onClick={() => setShowCreatePlaylist(false)}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <label htmlFor="playlist-name" className="block text-sm font-medium text-on-surface-variant mb-2">
                Name
              </label>
              <input
                id="playlist-name"
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="My Awesome Playlist"
                className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPlaylistName.trim()) {
                    handleCreatePlaylist();
                  }
                }}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreatePlaylist(false)}
                className="px-5 py-2.5 rounded-full font-bold text-white hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
                className="px-5 py-2.5 rounded-full font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Header Section */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-6xl font-extrabold font-headline tracking-tighter text-white mb-2">Library</h2>
            <p className="text-on-surface-variant font-label tracking-widest uppercase text-xs">
              Curated by you • {uniquePlaylists.length} items
            </p>
          </div>
          {activeTab === 'playlists' && (
            <button 
              onClick={() => setShowCreatePlaylist(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              Create Playlist
            </button>
          )}
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
