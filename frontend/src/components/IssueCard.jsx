import { ExternalLink, Hash } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import DifficultyBadge from './DifficultyBadge'
import { isValidGitHubIssueUrl } from '../utils/formatters'

export default function IssueCard({ issue }) {
  const {
    number, title, quality_score, skill_match, final_score,
    difficulty, reason, url, labels = [], repository, state, languages,
  } = issue

  const safeUrl = isValidGitHubIssueUrl(url) ? url : null

  return (
    <>
      <style>{`
        .issue-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.15s, transform 0.15s;
          animation: fadeIn 0.2s ease;
        }
        .issue-card:hover { border-color: var(--primary); transform: translateY(-1px); }
        .ic-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .ic-title-group { flex: 1; min-width: 0; }
        .ic-number {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 12px; color: var(--muted); margin-bottom: 5px;
        }
        .ic-state {
          margin-left: 8px; padding: 1px 7px; border-radius: 20px;
          font-size: 10px; font-weight: 700; text-transform: uppercase;
        }
        .ic-state-open { background: var(--success-muted); color: var(--success); }
        .ic-state-closed { background: var(--border); color: var(--muted); }
        .ic-title { font-size: 15px; font-weight: 600; color: var(--text); line-height: 1.45; word-break: break-word; }
        .ic-repo { font-size: 12px; color: var(--muted); margin-top: 4px; }
        .ic-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .ic-label {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 500; white-space: nowrap;
        }
        .ic-label-default { background: var(--primary-muted); color: var(--primary); border: 1px solid rgba(91,140,255,0.2); }
        .ic-label-lang { background: var(--warning-muted); color: var(--warning); border: 1px solid rgba(242,184,75,0.2); }
        .ic-scores {
          display: flex; gap: 24px;
          padding: 14px 0;
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
        }
        .ic-reason { font-size: 13px; color: var(--muted); line-height: 1.6; }
        .ic-reason strong { color: var(--text); font-weight: 600; }
        .ic-footer { display: flex; align-items: center; justify-content: flex-end; }
        .view-gh-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--primary-muted); color: var(--primary);
          border: 1px solid rgba(91,140,255,0.25); border-radius: var(--radius-sm);
          padding: 8px 16px; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: background 0.15s, border-color 0.15s;
        }
        .view-gh-btn:hover { background: rgba(91,140,255,0.22); border-color: var(--primary); }
      `}</style>
      <article className="issue-card">
        <div className="ic-top">
          <div className="ic-title-group">
            <div className="ic-number">
              <Hash size={11} />
              {number}
              {state && (
                <span className={`ic-state ic-state-${state === 'open' ? 'open' : 'closed'}`}>
                  {state}
                </span>
              )}
            </div>
            <p className="ic-title">{title}</p>
            {repository && <p className="ic-repo">{repository}</p>}
          </div>
          <DifficultyBadge difficulty={difficulty} />
        </div>

        {labels.length > 0 && (
          <div className="ic-tags">
            {labels.map((l, i) => (
              <span key={i} className="ic-label ic-label-default">{l}</span>
            ))}
          </div>
        )}

        {languages && languages.length > 0 && (
          <div className="ic-tags">
            {languages.map((l, i) => (
              <span key={i} className="ic-label ic-label-lang">{l}</span>
            ))}
          </div>
        )}

        <div className="ic-scores">
          <ScoreBadge score={quality_score} label="Quality" />
          <ScoreBadge score={skill_match} label="Skill Match" />
          <ScoreBadge score={final_score} label="Final Score" />
        </div>

        {reason && (
          <p className="ic-reason">
            <strong>Why this fits: </strong>{reason}
          </p>
        )}

        <div className="ic-footer">
          {safeUrl ? (
            <a href={safeUrl} target="_blank" rel="noreferrer" className="view-gh-btn">
              View on GitHub <ExternalLink size={13} />
            </a>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>No link available</span>
          )}
        </div>
      </article>
    </>
  )
}

