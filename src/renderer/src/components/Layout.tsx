import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Library, 
  PlusCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2
} from 'lucide-react';
import { usePlayerStore } from '../stores/playerStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentTrack, isPlaying, setPlaying } = usePlayerStore();

  const sidebarItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Library, label: 'Your Library', path: '/library' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex w-full h-full">
      {/* Sidebar */}
      <div className="w-64 bg-spotify-black p-6 flex flex-col">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-spotify-green">OpenSound</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Playlist Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex-1 justify-start">
              <PlusCircle size={20} />
              <span>Create Playlist</span>
            </button>
          </div>
          
          <button className="btn-ghost flex-1 justify-start">
            <Heart size={20} />
            <span>Liked Songs</span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-spotify-highlight my-6"></div>

        {/* Mini Player */}
        {currentTrack && (
          <div className="mt-auto p-4 bg-spotify-highlight rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              {currentTrack.album?.images?.[0] && (
                <img
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.name}
                  className="w-12 h-12 rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentTrack.name}
                </p>
                <p className="text-xs text-spotify-gray truncate">
                  {currentTrack.artists.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <button className="text-spotify-gray hover:text-white transition-colors">
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => setPlaying(!isPlaying)}
                className="text-white hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button className="text-spotify-gray hover:text-white transition-colors">
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-spotify-dark to-spotify-black">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-spotify-dark/50 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2">
              <ChevronLeft size={20} />
            </button>
            <button className="btn-ghost p-2">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2">
              <Volume2 size={20} />
            </button>
            <button className="btn-ghost p-2">
              <Maximize2 size={20} />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
