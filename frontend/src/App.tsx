import { BrowserRouter as Router } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { MainContent } from './components/MainContent'
import { Player } from './components/Player'
import { UpdateBanner } from './components/UpdateBanner'
import { SearchProvider } from './contexts/SearchContext'
import { PlayerProvider } from './contexts/PlayerContext'
import { PlaylistProvider } from './contexts/PlaylistContext'

function App() {
  return (
    <Router>
      <PlaylistProvider>
        <PlayerProvider>
          <SearchProvider>
            <div className="flex h-screen bg-spotify-black">
              <UpdateBanner />
              <Sidebar />
              <MainContent />
            </div>
            <Player />
          </SearchProvider>
        </PlayerProvider>
      </PlaylistProvider>
    </Router>
  )
}

export default App
