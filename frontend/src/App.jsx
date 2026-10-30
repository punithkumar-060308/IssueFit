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
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute(
      'data-theme',
      nextTheme === 'light' ? 'light' : ''
    )
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

      <main className="app-main">
        <div
          className={`dashboard-container${
            activeTab === 'leaderboard' ? ' full-width' : ''
          }`}
        >
          <div className="content-column">
            {activeTab === 'discover' ? (
              <DiscoverPage
                searchQuery={searchQuery}
                connectedRepo={connectedRepo}
              />
            ) : (
              <LeaderboardPage />
            )}
          </div>

          {activeTab === 'discover' && (
            <aside className="sidebar-column">
              <RepositoryConnectPanel onRepoConnected={setConnectedRepo} />
              <TrendingTodayPanel />
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
