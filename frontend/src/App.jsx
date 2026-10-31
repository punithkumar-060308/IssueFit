import { useState } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import DiscoverPage from './pages/DiscoverPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import RepositoryConnectPanel from './components/RepositoryConnectPanel'
import TrendingTodayPanel from './components/TrendingTodayPanel'
import { AuthProvider } from './context/AuthContext'
import AuthGuard from './components/auth/AuthGuard'

function Dashboard() {
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
    <div className="app-root">
      <div className="ambient-glow" aria-hidden="true" />

      <AppHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="app-container">
        <div
          className={`dashboard-grid${
            activeTab === 'leaderboard' || activeTab === 'profile' ? ' single-column' : ''
          }`}
        >
          <div className="main-column">
            {activeTab === 'discover' && (
              <DiscoverPage
                searchQuery={searchQuery}
                connectedRepo={connectedRepo}
              />
            )}
            {activeTab === 'leaderboard' && <LeaderboardPage />}
            {activeTab === 'profile' && <ProfilePage />}
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

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    </AuthProvider>
  )
}

export default App
