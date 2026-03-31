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
  Volume2,
  Maximize2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

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
          <Link to="/library?tab=create" className="btn-ghost flex items-center gap-3 w-full justify-start">
            <PlusCircle size={20} />
            <span className="font-medium">Create Playlist</span>
          </Link>
          
          <Link to="/library?tab=liked" className="btn-ghost flex items-center gap-3 w-full justify-start">
            <Heart size={20} />
            <span className="font-medium">Liked Songs</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-spotify-highlight my-6"></div>
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
