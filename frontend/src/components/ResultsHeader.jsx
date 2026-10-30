import { Trophy } from 'lucide-react'

export default function ResultsHeader({ count, username, repository }) {
  return (
    <>
      <style>{`
        .results-hdr {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
        }
        .results-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 16px; font-weight: 700; color: var(--text);
        }
        .results-meta { font-size: 13px; color: var(--muted); font-weight: 400; }
        .results-count {
          font-size: 12px; color: var(--muted); background: var(--surface);
          border: 1px solid var(--border); border-radius: 20px; padding: 3px 12px;
        }
      `}</style>
      <div className="results-hdr">
        <div className="results-title">
          <Trophy size={16} style={{ color: 'var(--warning)' }} />
          Top Matches
          {username && repository && (
            <span className="results-meta">
              for <strong style={{ color: 'var(--text)' }}>{username}</strong>
              {' '}in{' '}
              <strong style={{ color: 'var(--text)' }}>{repository}</strong>
            </span>
          )}
        </div>
        <span className="results-count">
          {count} recommendation{count !== 1 ? 's' : ''}
        </span>
      </div>
    </>
  )
}

