import { useEffect, useState } from 'react'
import { Trophy, Award, GitPullRequest, FolderGit2, Info } from 'lucide-react'
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
      .catch(() => {
        if (!cancelled) setEntries(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <style>{`
        .leaderboard-header-block {
          margin-bottom: 24px;
        }

        .leaderboard-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }

        .leaderboard-subtitle {
          font-size: 14px;
          color: var(--muted);
        }

        .leaderboard-table-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow-x: auto;
          box-shadow: var(--shadow-sm);
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .leaderboard-table th {
          background: var(--surface-2);
          padding: 14px 18px;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }

        .leaderboard-table td {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 13px;
        }

        .leaderboard-table tbody tr:last-child td {
          border-bottom: none;
        }

        .leaderboard-table tbody tr:hover td {
          background-color: var(--surface-hover);
        }

        .rank-badge {
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .rank-1 { color: #f59e0b; }
        .rank-2 { color: #94a3b8; }
        .rank-3 { color: #d97706; }

        .contributor-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }

        .contributor-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--muted);
          overflow: hidden;
          flex-shrink: 0;
        }

        .contributor-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .contributor-link {
          color: var(--text);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .contributor-link:hover {
          color: var(--primary);
        }

        .leaderboard-score-val {
          font-weight: 700;
          color: var(--success);
          font-size: 14px;
        }

        .leaderboard-explainer-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--muted);
          margin-top: 14px;
          line-height: 1.5;
        }
      `}</style>

      <div className="leaderboard-header-block">
        <h1 className="leaderboard-title">Contributor Leaderboard</h1>
        <p className="leaderboard-subtitle">
          Top contributors ranked by verified open-source contributions and issue resolutions.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Fetching contributor leaderboard data..." />
      ) : !entries || entries.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        <>
          <div className="leaderboard-table-card">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Contributor</th>
                  <th>Contributions</th>
                  <th>Repositories</th>
                  <th>Contribution Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const rank = idx + 1
                  const rankClass = rank <= 3 ? ` rank-${rank}` : ''
                  return (
                    <tr key={entry.username || idx}>
                      <td>
                        <span className={`rank-badge${rankClass}`}>
                          {rank === 1 && <Trophy size={14} />}
                          {rank === 2 && <Award size={14} />}
                          {rank === 3 && <Award size={14} />}
                          #{rank}
                        </span>
                      </td>

                      <td>
                        <div className="contributor-cell">
                          <div className="contributor-avatar">
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
                            className="contributor-link"
                          >
                            {entry.username}
                          </a>
                        </div>
                      </td>

                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <GitPullRequest size={13} style={{ color: 'var(--muted)' }} />
                          {entry.contributions ?? entry.merged_prs ?? '—'}
                        </span>
                      </td>

                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <FolderGit2 size={13} style={{ color: 'var(--muted)' }} />
                          {entry.repositories ?? '—'}
                        </span>
                      </td>

                      <td>
                        <span className="leaderboard-score-val">
                          {entry.score != null ? `${entry.score} pts` : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="leaderboard-explainer-note">
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Leaderboard scores are calculated from verified merged pull requests and contribution metrics provided by the backend API.
            </span>
          </div>
        </>
      )}
    </>
  )
}
