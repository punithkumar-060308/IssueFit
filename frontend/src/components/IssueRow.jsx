import { useState } from 'react'
import { ExternalLink, Hash, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import DifficultyBadge from './DifficultyBadge'
import { isValidGitHubIssueUrl } from '../utils/formatters'

export default function IssueRow({ issue }) {
  const [expanded, setExpanded] = useState(false)

  const {
    number,
    title,
    quality_score,
    skill_match,
    final_score,
    difficulty,
    reason,
    url,
    labels = [],
    repository,
    state = 'open',
    languages = [],
  } = issue

  const safeUrl = isValidGitHubIssueUrl(url) ? url : null
  const isOpen = (state || 'open').toLowerCase() === 'open'

  return (
    <>
      <style>{`
        .issue-row-main {
          transition: background-color 0.15s ease;
          cursor: pointer;
        }

        .issue-row-main:hover {
          background-color: var(--surface-hover);
        }

        .issue-row-main.is-expanded {
          background-color: var(--surface-hover);
          border-bottom-color: transparent !important;
        }

        .table-cell {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 13px;
        }

        /* State Badge */
        .state-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .state-badge.open {
          background: var(--success-muted);
          color: var(--success);
          border: 1px solid var(--success-border);
        }

        .state-badge.closed {
          background: var(--tag-bg);
          color: var(--muted);
          border: 1px solid var(--border);
        }

        .state-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        /* Name & Title */
        .issue-name-container {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          max-width: 360px;
        }

        .expand-toggle-btn {
          background: none;
          border: none;
          color: var(--muted);
          padding: 2px;
          display: flex;
          align-items: center;
          margin-top: 2px;
          border-radius: 4px;
        }

        .issue-title-text {
          font-weight: 600;
          color: var(--text);
          line-height: 1.4;
          word-break: break-word;
        }

        .issue-number-tag {
          font-size: 11px;
          color: var(--muted);
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 1px;
          margin-right: 6px;
        }

        /* Labels */
        .labels-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          max-width: 200px;
        }

        .label-pill {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          background: var(--tag-bg);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          white-space: nowrap;
        }

        /* Repository */
        .repo-link {
          font-size: 12px;
          color: var(--text-secondary);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          white-space: nowrap;
        }

        /* Languages */
        .language-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .lang-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          color: var(--warning);
          background: var(--warning-muted);
          border: 1px solid var(--warning-border);
          border-radius: 12px;
          padding: 2px 7px;
          white-space: nowrap;
        }

        .lang-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        /* Match Score Cell */
        .score-cell {
          text-align: center;
          min-width: 80px;
        }

        /* Action */
        .open-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          background: var(--primary-muted);
          color: var(--primary);
          border: 1px solid var(--primary-border);
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .open-action-btn:hover {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
        }

        /* Expanded Details Row */
        .expanded-row td {
          padding: 0 16px 18px 16px;
          background-color: var(--surface-hover);
          border-bottom: 1px solid var(--border);
        }

        .details-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .details-scores-bar {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .details-reason-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .reason-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 3px;
        }
      `}</style>

      <tr
        className={`issue-row-main${expanded ? ' is-expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="table-cell">
          <span className={`state-badge ${isOpen ? 'open' : 'closed'}`}>
            <span className="state-dot" />
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </td>

        <td className="table-cell">
          <div className="issue-name-container">
            <button
              type="button"
              className="expand-toggle-btn"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <div>
              <span className="issue-number-tag">
                <Hash size={11} />
                {number}
              </span>
              <span className="issue-title-text">{title}</span>
            </div>
          </div>
        </td>

        <td className="table-cell">
          {labels.length > 0 ? (
            <div className="labels-wrapper">
              {labels.slice(0, 3).map((lbl, idx) => (
                <span key={idx} className="label-pill">
                  {lbl}
                </span>
              ))}
              {labels.length > 3 && (
                <span className="label-pill" title={labels.slice(3).join(', ')}>
                  +{labels.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
          )}
        </td>

        <td className="table-cell">
          <span className="repo-link">{repository || '—'}</span>
        </td>

        <td className="table-cell">
          {languages && languages.length > 0 ? (
            <div className="language-tags">
              {languages.map((lang, idx) => (
                <span key={idx} className="lang-pill">
                  <span className="lang-dot" />
                  {lang}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
          )}
        </td>

        <td className="table-cell score-cell">
          <ScoreBadge score={final_score} label="Match" />
        </td>

        <td className="table-cell" onClick={(e) => e.stopPropagation()}>
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="open-action-btn"
            >
              <span>View</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="expanded-row">
          <td colSpan={7}>
            <div className="details-card">
              <div className="details-scores-bar">
                <ScoreBadge score={quality_score} label="Quality Score" />
                <ScoreBadge score={skill_match} label="Skill Match" />
                <ScoreBadge score={final_score} label="Overall Match" />
                <div style={{ marginLeft: 'auto' }}>
                  <DifficultyBadge difficulty={difficulty} />
                </div>
              </div>

              {reason && (
                <div className="details-reason-box">
                  <Sparkles size={16} className="reason-icon" />
                  <div>
                    <strong style={{ color: 'var(--text)', marginRight: 6 }}>
                      Recommendation Analysis:
                    </strong>
                    {reason}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

