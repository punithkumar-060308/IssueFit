import { useEffect, useState } from 'react'
import { TrendingUp, ExternalLink, Activity, Flame, Compass } from 'lucide-react'
import { getTrending } from '../services/issuefitApi'

export default function TrendingTodayPanel() {
  const [trendingData, setTrendingData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    getTrending()
      .then((data) => {
        if (!isCancelled) setTrendingData(data)
      })
      .catch(() => {
        if (!isCancelled) setTrendingData(null)
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [])

  const items = trendingData?.items || trendingData?.trending || null

  return (
    <>
      <style>{`
        .trending-station-card {
          background: var(--surface);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 24px;
          box-shadow: var(--shadow-glass);
        }

        .trending-header-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .trending-badge-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warning);
        }

        .trending-main-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .trending-items-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .trending-row-entry {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .trending-row-entry:first-child {
          padding-top: 0;
        }

        .trending-row-entry:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .rank-glow-num {
          font-size: 11px;
          font-weight: 800;
          color: var(--primary);
          background: var(--primary-muted);
          width: 20px;
          height: 20px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .trending-entry-meta {
          flex: 1;
          min-width: 0;
        }

        .trending-entry-link {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s ease;
          text-decoration: none;
          word-break: break-all;
        }

        .trending-entry-link:hover {
          color: var(--primary);
        }

        .trending-entry-desc {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }

        .trending-radar-empty {
          padding: 24px 10px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12.5px;
          line-height: 1.55;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .radar-sweep-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          background: var(--primary-muted);
          box-shadow: 0 0 16px var(--primary-glow);
        }

        .trending-spinner-ring {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 24px auto;
        }
      `}</style>

      <div className="trending-station-card">
        <div className="trending-header-row">
          <div className="trending-badge-icon">
            <Flame size={17} />
          </div>
          <h3 className="trending-main-title">Trending Today</h3>
        </div>

        {isLoading ? (
          <div className="trending-spinner-ring" aria-label="Loading trends" />
        ) : !items || items.length === 0 ? (
          <div className="trending-radar-empty">
            <div className="radar-sweep-icon">
              <Compass size={20} />
            </div>
            <div>
              <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 2 }}>
                Radar Standing By
              </strong>
              <span>Trending issues will stream in as repository activity increases.</span>
            </div>
          </div>
        ) : (
          <ul className="trending-items-list">
            {items.slice(0, 5).map((item, idx) => (
              <li key={idx} className="trending-row-entry">
                <span className="rank-glow-num">#{idx + 1}</span>
                <div className="trending-entry-meta">
                  <a
                    href={item.url || item.html_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="trending-entry-link"
                  >
                    <span>{item.name || item.full_name || item.title}</span>
                    <ExternalLink size={11} style={{ flexShrink: 0 }} />
                  </a>
                  {item.description && (
                    <p className="trending-entry-desc">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
