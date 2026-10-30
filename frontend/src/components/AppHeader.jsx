import { Sun, Moon, Bell, GitMerge, Github, Sparkles, Activity, LogOut } from 'lucide-react'
import NavigationTabs from './NavigationTabs'
import GlobalSearch from './GlobalSearch'
import { useAuth } from '../context/AuthContext'

export default function AppHeader({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
}) {
  const { user, logoutUser } = useAuth()

  return (
    <>
      <style>{`
        .header-floating-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(6, 8, 19, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--border);
        }

        [data-theme="light"] .header-floating-bar {
          background: rgba(255, 255, 255, 0.85);
        }

        .header-inner {
          max-width: 1480px;
          margin: 0 auto;
          height: 68px;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .header-brand-group {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--text);
          font-weight: 800;
          font-size: 19px;
          letter-spacing: -0.03em;
        }

        .brand-logo-gem {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
          position: relative;
        }

        .brand-pulse-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .brand-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-tag {
          font-size: 10px;
          font-weight: 700;
          color: #a855f7;
          background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 9999px;
          padding: 2px 7px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface-card);
          color: var(--text-muted);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .header-btn:hover {
          color: var(--text);
          background: var(--surface-hover);
          border-color: var(--border-bright);
          box-shadow: var(--shadow-glow);
        }

        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 4px 10px 4px 6px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .user-avatar-round {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }

        .user-gh-pill {
          font-size: 11px;
          color: var(--primary, #6366f1);
          background: rgba(99, 102, 241, 0.12);
          border-radius: 4px;
          padding: 1px 6px;
          margin-left: 2px;
        }

        .btn-signout {
          color: #f87171;
        }

        .btn-signout:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          color: var(--success);
          font-size: 11px;
          font-weight: 600;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
          animation: pulseGlow 2s infinite ease-in-out;
        }

        @media (max-width: 820px) {
          .header-inner {
            padding: 0 18px;
          }
          .brand-title {
            display: none;
          }
          .live-status-pill {
            display: none;
          }
          .user-name-text {
            display: none;
          }
        }
      `}</style>

      <header className="header-floating-bar">
        <div className="header-inner">
          <div className="header-brand-group">
            <a href="/" className="brand-link" aria-label="IssueFit Dashboard">
              <div className="brand-logo-gem">
                <GitMerge size={20} />
                <span className="brand-pulse-dot" />
              </div>
              <div className="brand-title-wrap">
                <span className="brand-title">IssueFit</span>
                <span className="brand-tag">AI Radar</span>
              </div>
            </a>

            <NavigationTabs activeTab={activeTab} onTabChange={onTabChange} />
          </div>

          <div className="header-controls">
            {activeTab === 'discover' && (
              <GlobalSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
              />
            )}

            <div className="live-status-pill" title="Backend API connected & verified">
              <span className="live-dot" />
              <span>API Live</span>
            </div>

            <button
              type="button"
              className="header-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user && (
              <div className="user-profile-badge" title={`Signed in as ${user.email || user.name}`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name || 'User'} className="user-avatar-round" />
                ) : (
                  <div className="user-avatar-round">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="user-name-text">{user.name || 'User'}</span>
                {user.github?.username && (
                  <span className="user-gh-pill">@{user.github.username}</span>
                )}
              </div>
            )}

            {user && (
              <button
                type="button"
                className="header-btn btn-signout"
                onClick={logoutUser}
                aria-label="Sign Out"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            )}

            {!user && (
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="header-btn"
                aria-label="GitHub Website"
                title="GitHub"
              >
                <Github size={17} />
              </a>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
