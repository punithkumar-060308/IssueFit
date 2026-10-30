import { useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import DiscoverPage from './pages/DiscoverPage'
import LeaderboardPage from './pages/LeaderboardPage'
import RepositoryConnectPanel from './components/RepositoryConnectPanel'
import TrendingTodayPanel from './components/TrendingTodayPanel'

function App() {
  const [activeTab, setActiveTab] = useState('discover')
  const [theme, setTheme] = useState('dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [connectedRepo, setConnectedRepo] = useState(null)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '')
  }

  return (
    <div className="app">
      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="app-body">
        <div className="main-content">
          {activeTab === 'discover' ? (
            <DiscoverPage searchQuery={searchQuery} connectedRepo={connectedRepo} />
          ) : (
            <LeaderboardPage />
          )}
        </div>
        {activeTab === 'discover' && (
          <aside className="sidebar">
            <RepositoryConnectPanel onRepoConnected={setConnectedRepo} />
            <TrendingTodayPanel />
          </aside>
        )}
      </div>
    </div>
  )
}

export default App

