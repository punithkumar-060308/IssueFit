import { useEffect, useState } from 'react'
import { TrendingUp, ExternalLink } from 'lucide-react'
import { getTrending } from '../services/issuefitApi'

export default function TrendingTodayPanel() {
  const [trending, setTrending] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getTrending()
      .then((data) => { if (!cancelled) setTrending(data) })
      .catch(() => { if (!cancelled) setTrending(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const items = trending?.items || trending?.trending || null

  return (
    <>
      <style>{`
        .tp { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .tp-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 7px; }
        .tp-list { display: flex; flex-direction: column; gap: 0; list-style: none; }
        .tp-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--border-light);
        }
        .tp-item:last-child { border-bottom: none; padding-bottom: 0; }
        .tp-item:first-child { padding-top: 0; }
        .tp-rank { font-size: 11px; font-weight: 700; color: var(--muted); min-width: 18px; margin-top: 2px; }
        .tp-info { flex: 1; min-width: 0; }
        .tp-name {
          font-size: 13px; font-weight: 600; color: var(--primary);
          display: flex; align-items: center; gap: 4px; transition: color 0.15s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tp-name:hover { color: var(--primary-hover); }
        .tp-desc { font-size: 11px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tp-empty { font-size: 13px; color: var(--muted); text-align: center; padding: 20px 0; line-height: 1.6; }
        .tp-spin {
          width: 22px; height: 22px; border: 2px solid var(--border);
          border-top-color: var(--primary); border-radius: 50%;
          animation: spin 0.8s linear infinite; margin: 20px auto;
        }
      `}</style>
      <div className="tp">
        <p className="tp-title">
          <TrendingUp size={14} style={{ color: 'var(--warning)' }} />
          Trending today
        </p>
        {loading ? (
          <div className="tp-spin" aria-label="Loading…" />
        ) : !items || items.length === 0 ? (
          <p className="tp-empty">
            Trending data will appear here when the backend provides it.
          </p>
        ) : (
          <ul className="tp-list">
            {items.slice(0, 5).map((item, i) => (
              <li key={i} className="tp-item">
                <span className="tp-rank">#{i + 1}</span>
                <div className="tp-info">
                  <a
                    href={item.url || item.html_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="tp-name"
                  >
                    {item.name || item.full_name || item.title}
                    <ExternalLink size={10} />
                  </a>
                  {item.description && <p className="tp-desc">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

