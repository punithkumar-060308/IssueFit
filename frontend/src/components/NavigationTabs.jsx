import { Compass, User } from 'lucide-react'

export default function NavigationTabs({ activeTab, onTabChange }) {
  return (
    <>
      <style>{`
        .nav-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--tag-bg, rgba(255, 255, 255, 0.04));
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }

        .nav-tab-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: var(--radius-xs);
          font-size: 13px;
          font-weight: 500;
          color: var(--muted, var(--text-muted));
          background: transparent;
          border: none;
          transition: all 0.15s ease;
          white-space: nowrap;
          cursor: pointer;
          min-height: 36px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-tab-item:hover {
          color: var(--text);
        }

        .nav-tab-item.active {
          color: var(--primary);
          background: var(--surface);
          box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.2));
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .nav-tabs {
            width: 100%;
            display: flex;
            justify-content: stretch;
            gap: 4px;
            padding: 3px;
          }

          .nav-tab-item {
            flex: 1;
            padding: 7px 6px;
            font-size: 12px;
            gap: 5px;
          }

          .nav-tab-item span {
            font-size: 11.5px;
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
          className={`nav-tab-item${activeTab === 'profile' ? ' active' : ''}`}
          onClick={() => onTabChange('profile')}
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <User size={16} />
          <span>Profile</span>
        </button>
      </nav>
    </>
  )
}
