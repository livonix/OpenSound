import { BrowserRouter as Router } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { MainContent } from './components/MainContent'
import { Player } from './components/Player'
import { SearchProvider } from './contexts/SearchContext'
import { PlayerProvider } from './contexts/PlayerContext'

function App() {
  return (
    <Router>
      <PlayerProvider>
        <SearchProvider>
          <div className="flex h-screen bg-spotify-black">
            <Sidebar />
            <MainContent />
          </div>
          <Player />
        </SearchProvider>
      </PlayerProvider>
    </Router>
  )
}

export default App
