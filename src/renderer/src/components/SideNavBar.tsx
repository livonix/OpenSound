import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const SideNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'home', path: '/' },
    { id: 'search', label: 'Search', icon: 'search', path: '/search' },
    { id: 'library', label: 'Library', icon: 'library_music', path: '/library' },
    { id: 'playlists', label: 'Playlists', icon: 'playlist_play', path: '/playlists' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-neutral-900/50 dark:bg-surface-container flex flex-col py-8 px-6 z-50">
      {/* Logo Section */}
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-white dark:text-primary font-headline">
          OpenSound
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label mt-1">
          Premium Curator
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-6 flex-1">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.path}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.path);
            }}
            className={`flex items-center gap-4 transition-colors py-1 group ${
              isActive(item.path)
                ? 'text-white dark:text-white font-bold border-r-2 border-primary'
                : 'text-neutral-400 dark:text-on-surface-variant hover:text-white dark:hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: isActive(item.path) ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
              }}
            >
              {item.icon}
            </span>
            <span className="font-label">{item.label}</span>
          </a>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
        <img
          alt="User profile avatar"
          className="w-10 h-10 rounded-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgRdoGlcv_S6lv5OHdaNe6o2K4py-D4-IXRHKZ6t02y_8oLvNPbAA-2--pQCQnTXfX55uAZkvWFtZ2A9pirf5tIPgM4l01aAhKmIb7nyTDmipvCMuQ4K3uSw7nF03wCrWt6rsxNX3ixqZ1teJInQztXH6YPPn_cOz38YhZ1ULhI1Qr1EWsW5c014rK85x7DTwLGpQ0sekwzb-cVp-umUm6uS1VYr899vKJPqB-p94wGKfkjTJqKo94b-EiC9XY6cAvohLPHJO2HQ"
        />
        <div className="overflow-hidden">
          <p className="text-sm font-bold truncate font-headline">Alex Rivera</p>
          <p className="text-xs text-on-surface-variant font-label truncate">Pro Member</p>
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;
