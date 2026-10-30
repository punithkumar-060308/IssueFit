import { useEffect, useState } from 'react'
import { TrendingUp, ExternalLink, Activity } from 'lucide-react'
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
        .trending-panel-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 22px;
          box-shadow: var(--shadow-sm);
        }

        .trending-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .trending-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trending-icon {
          color: var(--warning);
        }

        .trending-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .trending-list-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .trending-list-item:first-child {
          padding-top: 0;
        }

        .trending-list-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .trending-rank-num {
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
          min-width: 18px;
          padding-top: 1px;
        }

        .trending-item-content {
          flex: 1;
          min-width: 0;
        }

        .trending-item-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s ease;
          text-decoration: none;
          word-break: break-all;
        }

        .trending-item-link:hover {
          color: var(--primary);
        }

        .trending-item-desc {
          font-size: 12px;
          color: var(--muted);
          margin-top: 3px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .trending-empty-state {
          padding: 24px 8px;
          text-align: center;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .trending-empty-icon {
          color: var(--muted);
          opacity: 0.35;
          margin: 0 auto 10px auto;
        }

        .trending-loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 24px auto;
        }
      `}</style>

      <div className="trending-panel-card">
        <div className="trending-header">
          <h3 className="trending-title">
            <TrendingUp size={17} className="trending-icon" />
            <span>Trending today</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="trending-loading-spinner" aria-label="Loading trending issues" />
        ) : !items || items.length === 0 ? (
          <div className="trending-empty-state">
            <Activity size={28} className="trending-empty-icon" />
            <p>Trending issues will appear here when data is available.</p>
          </div>
        ) : (
          <ul className="trending-list">
            {items.slice(0, 5).map((item, idx) => (
              <li key={idx} className="trending-list-item">
                <span className="trending-rank-num">#{idx + 1}</span>
                <div className="trending-item-content">
                  <a
                    href={item.url || item.html_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="trending-item-link"
                  >
                    <span>{item.name || item.full_name || item.title}</span>
                    <ExternalLink size={11} style={{ flexShrink: 0 }} />
                  </a>
                  {item.description && (
                    <p className="trending-item-desc">{item.description}</p>
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
