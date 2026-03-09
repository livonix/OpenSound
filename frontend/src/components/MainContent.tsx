import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';

export const MainContent: React.FC = () => {
  return (
    <main className="flex-1 bg-gradient-to-b from-gray-900 to-spotify-black overflow-y-auto">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
    </main>
  );
};
