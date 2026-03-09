import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { MainContent } from './components/MainContent'
import { Player } from './components/Player'
import { SearchProvider } from './contexts/SearchContext'
import { PlayerProvider } from './contexts/PlayerContext'

function App() {
  return (
    <Router>
      <SearchProvider>
        <PlayerProvider>
          <div className="flex h-screen bg-spotify-black">
            <Sidebar />
            <MainContent />
          </div>
          <Player />
        </PlayerProvider>
      </SearchProvider>
    </Router>
  )
}

export default App
