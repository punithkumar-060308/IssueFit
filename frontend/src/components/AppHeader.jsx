import { Search, Bell, User, Sun, Moon, GitBranch } from 'lucide-react'

export default function AppHeader({
  activeTab, onTabChange, theme, onToggleTheme, searchQuery, onSearchChange,
}) {
  return (
    <>
      <style>{`
        .app-header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
          flex-shrink: 0;
          letter-spacing: -0.4px;
        }
        .header-nav { display: flex; gap: 2px; }
        .nav-tab {
          background: none;
          border: none;
          padding: 7px 16px;
          border-radius: var(--radius-sm);
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
          transition: color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .nav-tab:hover { color: var(--text); background: var(--surface-hover); }
        .nav-tab.active { color: var(--primary); background: var(--primary-muted); }
        .header-search {
          flex: 1;
          max-width: 320px;
          position: relative;
        }
        .header-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }
        .header-search input {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 7px 12px 7px 34px;
          color: var(--text);
          font-size: 13px;
          transition: border-color 0.15s;
        }
        .header-search input::placeholder { color: var(--muted); opacity: 0.7; }
        .header-search input:focus { outline: none; border-color: var(--primary); }
        .header-actions { margin-left: auto; display: flex; align-items: center; gap: 4px; }
        .icon-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: var(--radius-sm);
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .icon-btn:hover { color: var(--text); background: var(--surface-hover); }
        .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (max-width: 768px) {
          .header-search { max-width: 160px; }
          .logo-text { display: none; }
        }
        @media (max-width: 540px) {
          .header-search { display: none; }
        }
      `}</style>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <GitBranch size={20} />
            <span className="logo-text">IssueFit</span>
          </div>

          <nav className="header-nav" aria-label="Main navigation">
            <button
              className={`nav-tab${activeTab === 'discover' ? ' active' : ''}`}
              onClick={() => onTabChange('discover')}
            >
              Discover
            </button>
            <button
              className={`nav-tab${activeTab === 'leaderboard' ? ' active' : ''}`}
              onClick={() => onTabChange('leaderboard')}
            >
              Leaderboard
            </button>
          </nav>

          <div className="header-search">
            <Search size={14} className="header-search-icon" />
            <input
              type="search"
              placeholder="Search issues, repos, labels…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Filter issues"
            />
          </div>

          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-btn" aria-label="Notifications" disabled title="Notifications (not in MVP)">
              <Bell size={18} />
            </button>
            <button className="icon-btn" aria-label="User profile" disabled title="Profile (not in MVP)">
              <User size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

