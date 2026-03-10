import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { PlaylistPage } from './pages/Playlist';
import { Player } from './components/Player';
import { usePlayerStore } from './stores/playerStore';

function App() {
  const { currentTrack } = usePlayerStore();

  return (
    <Router>
      <div className="h-screen flex flex-col bg-spotify-black">
        <div className="flex flex-1 overflow-hidden">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
            </Routes>
          </Layout>
        </div>
        
        {currentTrack && (
          <div className="h-24 border-t border-spotify-highlight">
            <Player />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
