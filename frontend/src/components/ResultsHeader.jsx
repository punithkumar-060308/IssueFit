import { Trophy, Sparkles, Filter, Radio } from 'lucide-react'

export default function ResultsHeader({ count, username, repository }) {
  return (
    <>
      <style>{`
        .results-header-station {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
          gap: 16px;
          flex-wrap: wrap;
        }

        .results-meta-headline {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 17px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .results-live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }

        .results-sub-spec {
          font-size: 13.5px;
          color: var(--text-muted);
          font-weight: 400;
        }

        .results-count-capsule {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-muted);
          border: 1px solid var(--border-accent);
          border-radius: 9999px;
          padding: 4px 12px;
        }
      `}</style>

      <div className="results-header-station">
        <div className="results-meta-headline">
          <span className="results-live-indicator" />
          <span>Ranked Matches</span>
          {username && repository && (
            <span className="results-sub-spec">
              for <strong style={{ color: 'var(--text)' }}>@{username}</strong> in{' '}
              <strong style={{ color: 'var(--text)' }}>{repository}</strong>
            </span>
          )}
        </div>

        <span className="results-count-capsule">
          <Sparkles size={12} />
          <span>{count} recommendation{count !== 1 ? 's' : ''} found</span>
        </span>
      </div>
    </>
  )
}
