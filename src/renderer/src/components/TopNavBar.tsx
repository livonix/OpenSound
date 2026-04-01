import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TopNavBarProps {
  searchPlaceholder?: string;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ 
  searchPlaceholder = "Search artists, songs, or albums..."
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isSearchPage = location.pathname === '/search';

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Navigate to search page with query
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleSearchClick = () => {
    // Always navigate to search page when clicking search
    navigate('/search');
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] bg-transparent backdrop-blur-xl flex justify-between items-center px-8 h-16 z-40">
      {/* Search Bar - Only show if not on search page */}
      {!isSearchPage && (
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleSearchClick}
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant font-label"
            />
          </div>
        </div>
      )}

      {/* Right Actions - Always aligned to right */}
      <div className={`flex items-center gap-6 ${!isSearchPage ? '' : 'ml-auto'}`}>
        <button className="text-neutral-400 dark:text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-neutral-400 dark:text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img
            alt="User profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuANNKNmT78WXv7Ps6w4_J-Rm6OkaUGtbJn8Pqe004opN7wXI4XTbzhgCqQu7ZTHaZTrdDzK2JAY4RPUy-0fXaLbHVsUhdTABfBCPYfbRnXyZ1xsrqIk0wIkg4wNZ19LPmsenJlBI9UXB7nw1a_C5Y0Wk23i5pFVfSoBgYMDQOIxe-sjwu4zvGGOuO0FNLOkH-K-MvQCCdHlQgY1L35nSZjUBAfDIPNOkjYr0ku4rQrpGVg5MxyMYeZbqRxmNYu6HjEQgGic4jJcKQ"
          />
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
