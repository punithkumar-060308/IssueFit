import { useState } from 'react'
import { ExternalLink, Hash, ChevronDown, ChevronUp, Sparkles, FolderGit2 } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import DifficultyBadge from './DifficultyBadge'
import { isValidGitHubIssueUrl, parseIssueOwnerAndRepo } from '../utils/formatters'
import IssueBreakdownModal from './breakdown/IssueBreakdownModal'

export default function IssueRow({ issue }) {
  const [expanded, setExpanded] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

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
  const parsedRepo = parseIssueOwnerAndRepo(issue)

  return (
    <>
      <style>{`
        .table-row-item {
          transition: background-color 0.15s ease;
          cursor: pointer;
        }

        .table-row-item:hover {
          background-color: var(--surface-hover);
        }

        .table-row-item.row-active {
          background-color: var(--surface-hover);
          border-bottom-color: transparent !important;
        }

        .row-cell {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 13px;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Status Beacon */
        .state-beacon {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }

        .state-beacon.open {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-border);
        }

        .state-beacon.closed {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .beacon-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 6px currentColor;
        }

        /* Issue Name Container */
        .issue-title-container {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
        }

        .toggle-arrow {
          background: var(--surface-card);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 3px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .table-row-item:hover .toggle-arrow {
          color: var(--primary);
          border-color: var(--border-accent);
        }

        .issue-text-wrap {
          flex: 1;
          min-width: 0;
        }

        .issue-num-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--primary);
          font-weight: 600;
          background: var(--primary-muted);
          padding: 1px 6px;
          border-radius: 4px;
          margin-right: 6px;
          display: inline-flex;
          align-items: center;
        }

        .issue-title-heading {
          font-weight: 700;
          color: var(--text);
          line-height: 1.45;
          letter-spacing: -0.01em;
          word-break: break-word;
        }

        /* Label Pills */
        .labels-collection {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          max-width: 100%;
        }

        .clean-label-pill {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          border: 1px solid var(--border);
          white-space: nowrap;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Repo Link */
        .repo-badge-cell {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        /* Languages */
        .lang-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .lang-pill-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: 9999px;
          padding: 2px 8px;
          white-space: nowrap;
        }

        .lang-dot-bullet {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        /* Action View Button */
        .action-inspect-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 700;
          background: var(--surface-card);
          color: var(--text);
          border: 1px solid var(--border);
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .row-understand-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 700;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
          color: #a5b4fc;
          border: 1px solid var(--border-accent);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .row-understand-btn:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(6, 182, 212, 0.28) 100%);
          color: #ffffff;
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .action-inspect-btn:hover {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        /* Expanded Inspection Drawer */
        .expanded-details-container td {
          padding: 0 16px 18px 16px;
          background-color: var(--surface-hover);
          border-bottom: 1px solid var(--border);
        }

        .inspection-glass-panel {
          background: var(--surface-solid);
          border: 1px solid var(--border-bright);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .inspection-metrics-header {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .score-gauges-cluster {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .ai-reason-drawer {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: var(--text);
          font-size: 13px;
          line-height: 1.55;
        }

        .ai-spark-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>

      <tr
        className={`table-row-item${expanded ? ' row-active' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="row-cell">
          <span className={`state-beacon ${isOpen ? 'open' : 'closed'}`}>
            <span className="beacon-dot" />
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </td>

        <td className="row-cell">
          <div className="issue-title-container">
            <span className="toggle-arrow">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
            <div className="issue-text-wrap">
              <span className="issue-num-badge">#{number}</span>
              <span className="issue-title-heading">{title}</span>
            </div>
          </div>
        </td>

        <td className="row-cell">
          {labels.length > 0 ? (
            <div className="labels-collection">
              {labels.slice(0, 2).map((lbl, idx) => (
                <span key={idx} className="clean-label-pill" title={lbl}>
                  {lbl}
                </span>
              ))}
              {labels.length > 2 && (
                <span className="clean-label-pill" title={labels.slice(2).join(', ')}>
                  +{labels.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
          )}
        </td>

        <td className="row-cell">
          <span className="repo-badge-cell" title={repository}>
            {repository || '—'}
          </span>
        </td>

        <td className="row-cell">
          {languages && languages.length > 0 ? (
            <div className="lang-pills-row">
              {languages.map((lang, idx) => (
                <span key={idx} className="lang-pill-item">
                  <span className="lang-dot-bullet" />
                  {lang}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
          )}
        </td>

        <td className="row-cell" style={{ textAlign: 'center' }}>
          <ScoreBadge score={final_score} label="" />
        </td>

        <td className="row-cell" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="action-inspect-btn"
            >
              <span>GitHub</span>
              <ExternalLink size={11} />
            </a>
          ) : (
            <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="expanded-details-container">
          <td colSpan={7}>
            <div className="inspection-glass-panel">
              <div className="inspection-metrics-header">
                <div className="score-gauges-cluster">
                  <ScoreBadge score={quality_score} label="Issue Quality" />
                  <ScoreBadge score={skill_match} label="Skill Alignment" />
                  <ScoreBadge score={final_score} label="Total Suitability" />
                </div>

                <div style={{ marginLeft: 'auto' }}>
                  <DifficultyBadge difficulty={difficulty} />
                </div>
              </div>

              {reason && (
                <div className="ai-reason-drawer">
                  <Sparkles size={16} className="ai-spark-icon" />
                  <div>
                    <strong style={{ color: 'var(--primary)', marginRight: 6 }}>
                      Suitability Analysis:
                    </strong>
                    <span>{reason}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  className="row-understand-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowBreakdown(true)
                  }}
                  title="Get maintainer-level guidance & breakdown"
                >
                  <Sparkles size={13} />
                  <span>Understand this issue</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {showBreakdown && parsedRepo && (
        <IssueBreakdownModal
          issue={issue}
          owner={parsedRepo.owner}
          repo={parsedRepo.repo}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </>
  )
}
