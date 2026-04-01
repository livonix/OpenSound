import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SideNavBar from './components/SideNavBar';
import TopNavBar from './components/TopNavBar';
import BottomNavBar from './components/BottomNavBar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import PlayerPage from './pages/PlayerPage';
import { usePlayerStore } from './stores/playerStore';

function App() {
  const { currentTrack, isPlaying, currentTime, duration, volume } = usePlayerStore();

  return (
    <Router>
      <div className="h-screen flex flex-col bg-background text-on-background font-body">
        {/* Side Navigation */}
        <SideNavBar />
        
        {/* Main Content Area */}
        <div className="ml-64 flex-1 flex flex-col">
          {/* Top Navigation */}
          <TopNavBar />
          
          {/* Page Content */}
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/player" element={<PlayerPage />} />
            </Routes>
          </div>
        </div>
        
        {/* Bottom Player */}
        {currentTrack && (
          <BottomNavBar
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onPlayPause={() => {/* Handle play/pause */}}
            onPrevious={() => {/* Handle previous */}}
            onNext={() => {/* Handle next */}}
            onSeek={(time) => {/* Handle seek */}}
            onVolumeChange={(vol) => {/* Handle volume change */}}
            onShuffle={() => {/* Handle shuffle */}}
            onRepeat={() => {/* Handle repeat */}}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
