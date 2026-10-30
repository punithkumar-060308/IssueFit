import { Compass, Trophy } from 'lucide-react'

export default function NavigationTabs({ activeTab, onTabChange }) {
  return (
    <>
      <style>{`
        .nav-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--tag-bg);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }

        .nav-tab-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: var(--radius-xs);
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          background: transparent;
          border: none;
          transition: all 0.15s ease;
          white-space: nowrap;
          cursor: pointer;
        }

        .nav-tab-item:hover {
          color: var(--text);
        }

        .nav-tab-item.active {
          color: var(--primary);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .nav-tab-item {
            padding: 5px 10px;
            font-size: 12px;
          }
        }
      `}</style>
      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-tab-item${activeTab === 'discover' ? ' active' : ''}`}
          onClick={() => onTabChange('discover')}
          aria-current={activeTab === 'discover' ? 'page' : undefined}
        >
          <Compass size={16} />
          <span>Discover</span>
        </button>
        <button
          type="button"
          className={`nav-tab-item${activeTab === 'leaderboard' ? ' active' : ''}`}
          onClick={() => onTabChange('leaderboard')}
          aria-current={activeTab === 'leaderboard' ? 'page' : undefined}
        >
          <Trophy size={16} />
          <span>Leaderboard</span>
        </button>
      </nav>
    </>
  )
}

