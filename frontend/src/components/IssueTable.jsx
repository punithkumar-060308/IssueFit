import { ExternalLink, Hash } from 'lucide-react'
import DifficultyBadge from './DifficultyBadge'
import ScoreBadge from './ScoreBadge'
import { isValidGitHubIssueUrl } from '../utils/formatters'

export default function IssueTable({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null
  return (
    <>
      <style>{`
        .it-wrap {
          overflow-x: auto; border-radius: var(--radius);
          border: 1px solid var(--border); background: var(--surface);
          animation: fadeIn 0.2s ease;
        }
        .it-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .it-table th {
          text-align: left; padding: 12px 16px;
          font-size: 11px; font-weight: 700; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.6px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2); white-space: nowrap;
        }
        .it-table td {
          padding: 14px 16px; border-bottom: 1px solid var(--border-light);
          vertical-align: middle; color: var(--text);
        }
        .it-table tr:last-child td { border-bottom: none; }
        .it-table tbody tr:hover td { background: var(--surface-hover); }
        .it-state {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap;
        }
        .it-state-open { background: var(--success-muted); color: var(--success); border: 1px solid rgba(53,201,138,0.3); }
        .it-state-closed { background: var(--border); color: var(--muted); }
        .it-name { font-weight: 600; display: flex; flex-direction: column; gap: 3px; }
        .it-num { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 2px; }
        .it-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .it-tag {
          display: inline-block; padding: 2px 7px; border-radius: 20px;
          font-size: 10px; font-weight: 500; white-space: nowrap;
        }
        .it-tag-label { background: var(--primary-muted); color: var(--primary); border: 1px solid rgba(91,140,255,0.2); }
        .it-tag-lang { background: var(--warning-muted); color: var(--warning); border: 1px solid rgba(242,184,75,0.2); }
        .it-open-btn {
          display: inline-flex; align-items: center; gap: 4px;
          color: var(--primary); font-size: 12px; font-weight: 600;
          padding: 5px 10px; border-radius: var(--radius-sm);
          border: 1px solid rgba(91,140,255,0.3);
          text-decoration: none; transition: background 0.15s; white-space: nowrap;
        }
        .it-open-btn:hover { background: var(--primary-muted); }
        .it-muted { color: var(--muted); font-size: 12px; }
      `}</style>
      <div className="it-wrap">
        <table className="it-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Name</th>
              <th>Labels</th>
              <th>Repository</th>
              <th>Languages</th>
              <th>Match Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((issue, i) => {
              const safeUrl = isValidGitHubIssueUrl(issue.url) ? issue.url : null
              return (
                <tr key={issue.number ?? i}>
                  <td>
                    <span className={`it-state it-state-${issue.state === 'open' ? 'open' : 'closed'}`}>
                      {issue.state || 'open'}
                    </span>
                  </td>
                  <td>
                    <div className="it-name">
                      <span className="it-num"><Hash size={10} />{issue.number}</span>
                      <span>{issue.title}</span>
                    </div>
                  </td>
                  <td>
                    {issue.labels?.length > 0 ? (
                      <div className="it-tags">
                        {issue.labels.map((l, j) => (
                          <span key={j} className="it-tag it-tag-label">{l}</span>
                        ))}
                      </div>
                    ) : <span className="it-muted">—</span>}
                  </td>
                  <td><span className="it-muted">{issue.repository || '—'}</span></td>
                  <td>
                    {issue.languages?.length > 0 ? (
                      <div className="it-tags">
                        {issue.languages.map((l, j) => (
                          <span key={j} className="it-tag it-tag-lang">{l}</span>
                        ))}
                      </div>
                    ) : <span className="it-muted">—</span>}
                  </td>
                  <td><ScoreBadge score={issue.final_score} label="Final" /></td>
                  <td>
                    {safeUrl ? (
                      <a href={safeUrl} target="_blank" rel="noreferrer" className="it-open-btn">
                        Open <ExternalLink size={11} />
                      </a>
                    ) : <span className="it-muted">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

