import { useEffect, useState } from 'react'
import { getLeaderboard } from '../services/issuefitApi'
import EmptyLeaderboard from '../components/EmptyLeaderboard'
import LoadingState from '../components/LoadingState'

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    let cancelled = false
    getLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data?.entries || data?.leaderboard || null)
      })
      .catch(() => { if (!cancelled) setEntries(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <style>{`
        .lb-heading { font-size: 26px; font-weight: 800; color: var(--text); margin-bottom: 4px; letter-spacing: -0.5px; }
        .lb-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }
        .lb-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow-x: auto; }
        .lb-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .lb-table th {
          text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700;
          color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px;
          border-bottom: 1px solid var(--border); background: var(--surface-2); white-space: nowrap;
        }
        .lb-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
        .lb-table tr:last-child td { border-bottom: none; }
        .lb-table tbody tr:hover td { background: var(--surface-hover); }
        .lb-rank { font-weight: 800; font-size: 15px; }
        .lb-rank-1 { color: #ffd700; }
        .lb-rank-2 { color: #c0c0c0; }
        .lb-rank-3 { color: #cd7f32; }
        .lb-user { display: flex; align-items: center; gap: 10px; font-weight: 600; }
        .lb-avatar {
          width: 30px; height: 30px; border-radius: 50%; background: var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: var(--muted); overflow: hidden; flex-shrink: 0;
        }
        .lb-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .lb-score { font-weight: 800; color: var(--success); font-size: 15px; }
        .lb-note { font-size: 12px; color: var(--muted); margin-top: 14px; line-height: 1.5; }
      `}</style>

      <h1 className="lb-heading">Leaderboard</h1>
      <p className="lb-sub">Top contributors ranked by verified contribution activity.</p>

      {loading ? (
        <LoadingState message="Loading leaderboard…" />
      ) : !entries || entries.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        <>
          <div className="lb-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Contributor</th>
                  <th>Contributions</th>
                  <th>Repositories</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const rank = i + 1
                  return (
                    <tr key={entry.username || i}>
                      <td>
                        <span className={`lb-rank${rank <= 3 ? ` lb-rank-${rank}` : ''}`}>
                          #{rank}
                        </span>
                      </td>
                      <td>
                        <div className="lb-user">
                          <div className="lb-avatar">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt={entry.username} />
                            ) : (
                              (entry.username || '?')[0].toUpperCase()
                            )}
                          </div>
                          <a
                            href={`https://github.com/${entry.username}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--text)' }}
                          >
                            {entry.username}
                          </a>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{entry.contributions ?? entry.merged_prs ?? '—'}</td>
                      <td style={{ color: 'var(--muted)' }}>{entry.repositories ?? '—'}</td>
                      <td><span className="lb-score">{entry.score ?? '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="lb-note">
            Scores reflect merged pull requests and repository contributions verified through GitHub data.
          </p>
        </>
      )}
    </>
  )
}

