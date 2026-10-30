import { Sun, Moon, Bell, GitPullRequest, Github } from 'lucide-react'
import NavigationTabs from './NavigationTabs'
import GlobalSearch from './GlobalSearch'

export default function AppHeader({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
}) {
  return (
    <>
      <style>{`
        .app-header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .header-content {
          max-width: 1440px;
          margin: 0 auto;
          height: 64px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
          font-weight: 700;
          font-size: 17px;
          letter-spacing: -0.02em;
        }

        .brand-icon-box {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .brand-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary);
          background: var(--primary-muted);
          border: 1px solid var(--primary-border);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .header-btn:hover {
          color: var(--text);
          background: var(--surface-hover);
          border-color: var(--border-light);
        }

        .header-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .profile-avatar-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--surface-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .profile-avatar-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 0 16px;
            gap: 12px;
          }
          .header-left {
            gap: 14px;
          }
          .brand-name {
            display: none;
          }
        }
      `}</style>

      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <a href="/" className="brand-logo" aria-label="IssueFit Home">
              <div className="brand-icon-box">
                <GitPullRequest size={18} />
              </div>
              <span className="brand-name">IssueFit</span>
              <span className="brand-badge">MVP</span>
            </a>

            <NavigationTabs activeTab={activeTab} onTabChange={onTabChange} />
          </div>

          <div className="header-right">
            {activeTab === 'discover' && (
              <GlobalSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
              />
            )}

            <button
              type="button"
              className="header-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              className="header-btn"
              aria-label="Notifications"
              disabled
              title="Notifications (Available with GitHub Auth)"
            >
              <Bell size={17} />
            </button>

            <button
              type="button"
              className="profile-avatar-btn"
              aria-label="GitHub Profile"
              title="GitHub Profile"
            >
              <Github size={17} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
