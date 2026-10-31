import { useEffect, useState } from 'react'
import { Trophy, Award, GitPullRequest, FolderGit2, Info, Star, ExternalLink, ShieldCheck } from 'lucide-react'
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
        if (!cancelled) setEntries(data?.entries || data?.leaderboard || data?.items || null)
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
        .leaderboard-header-section {
          margin-bottom: 28px;
        }

        .lb-title-display {
          font-size: 32px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }

        .lb-subtitle-display {
          font-size: 14.5px;
          color: var(--text-muted);
        }

        .leaderboard-bento-viewport {
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow-x: auto;
          box-shadow: var(--shadow-glass);
        }

        .lb-master-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .lb-master-table th {
          background: var(--surface-solid);
          padding: 16px 20px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }

        .lb-master-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 13.5px;
        }

        .lb-master-table tbody tr:last-child td {
          border-bottom: none;
        }

        .lb-master-table tbody tr:hover td {
          background-color: var(--surface-hover);
        }

        .contributor-rank-tag {
          font-weight: 800;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .rank-gold { color: #f59e0b; text-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
        .rank-silver { color: #94a3b8; }
        .rank-bronze { color: #d97706; }

        .contributor-id-box {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
        }

        .contributor-avatar-ring {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--surface-card);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: var(--primary);
          overflow: hidden;
          flex-shrink: 0;
        }

        .contributor-avatar-ring img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .contributor-handle {
          color: var(--text);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s ease;
        }

        .contributor-handle:hover {
          color: var(--primary);
        }

        .lb-points-pill {
          display: inline-flex;
          align-items: baseline;
          gap: 3px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          color: var(--success);
          font-weight: 800;
          font-size: 13px;
        }

        .telemetry-footer-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: var(--radius-sm);
          background: var(--surface-card);
          border: 1px solid var(--border);
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 20px;
        }
      `}</style>

      <div className="leaderboard-header-section">
        <h1 className="lb-title-display">Contributor Hall of Fame</h1>
        <p className="lb-subtitle-display">
          Top open-source contributors ranked by impact, verified merged pull requests, and solutions.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Fetching contributor telemetry and rankings..." />
      ) : !entries || entries.length === 0 ? (
        <EmptyLeaderboard />
      ) : (
        <>
          <div className="leaderboard-bento-viewport">
            <table className="lb-master-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Rank</th>
                  <th>Contributor</th>
                  <th>Merged Pull Requests</th>
                  <th>Repositories</th>
                  <th>Impact Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const rank = idx + 1
                  let rankClass = ''
                  if (rank === 1) rankClass = ' rank-gold'
                  else if (rank === 2) rankClass = ' rank-silver'
                  else if (rank === 3) rankClass = ' rank-bronze'

                  return (
                    <tr key={entry.username || idx}>
                      <td>
                        <span className={`contributor-rank-tag${rankClass}`}>
                          {rank === 1 && <Trophy size={15} />}
                          {rank === 2 && <Award size={15} />}
                          {rank === 3 && <Award size={15} />}
                          #{rank}
                        </span>
                      </td>

                      <td>
                        <div className="contributor-id-box">
                          <div className="contributor-avatar-ring">
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
                            className="contributor-handle"
                          >
                            <span>{entry.username}</span>
                            <ExternalLink size={11} style={{ opacity: 0.6 }} />
                          </a>
                        </div>
                      </td>

                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                          <GitPullRequest size={14} style={{ color: 'var(--primary)' }} />
                          <span>{entry.contributions ?? entry.merged_prs ?? '—'}</span>
                        </span>
                      </td>

                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                          <FolderGit2 size={14} style={{ color: 'var(--accent-cyan)' }} />
                          <span>{entry.repositories ?? '—'}</span>
                        </span>
                      </td>

                      <td>
                        <span className="lb-points-pill">
                          <span>{entry.score != null ? entry.score : '—'}</span>
                          <span style={{ fontSize: 10, opacity: 0.8 }}>pts</span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="telemetry-footer-banner">
            <ShieldCheck size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>
              All leaderboard metrics are computed directly against verified GitHub public events and issue closures.
            </span>
          </div>
        </>
      )}
    </>
  )
}
