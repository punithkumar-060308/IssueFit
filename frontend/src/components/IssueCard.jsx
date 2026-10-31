import { useState } from 'react'
import { ExternalLink, Hash, Sparkles, FolderGit2 } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import DifficultyBadge from './DifficultyBadge'
import { isValidGitHubIssueUrl, parseIssueOwnerAndRepo } from '../utils/formatters'
import IssueBreakdownModal from './breakdown/IssueBreakdownModal'

export default function IssueCard({ issue }) {
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
        .bento-issue-card {
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-card);
          position: relative;
        }

        .bento-issue-card:hover {
          border-color: var(--border-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow), var(--shadow-card);
        }

        .card-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .card-state-beacon {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .card-state-beacon.open {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-border);
        }

        .card-state-beacon.closed {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .card-beacon-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .card-issue-identity {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-num-repo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-muted);
          font-family: 'JetBrains Mono', monospace;
        }

        .card-issue-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.45;
          letter-spacing: -0.015em;
        }

        .card-tags-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .card-label-chip {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .card-scores-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }

        .card-reason-box {
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.55;
          padding: 10px 12px;
          background: rgba(99, 102, 241, 0.04);
          border-left: 3px solid var(--primary);
          border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
        }

        .card-footer-action {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .card-understand-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 700;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
          color: #a5b4fc;
          border: 1px solid var(--border-accent);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .card-understand-btn:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.28) 0%, rgba(6, 182, 212, 0.28) 100%);
          color: #ffffff;
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .card-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 700;
          background: var(--surface-hover);
          color: var(--text);
          border: 1px solid var(--border);
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .card-view-btn:hover {
          transform: translateY(-1px);
          border-color: var(--border-bright);
          color: #ffffff;
        }
      `}</style>

      <article className="bento-issue-card">
        <div className="card-header-bar">
          <span className={`card-state-beacon ${isOpen ? 'open' : 'closed'}`}>
            <span className="card-beacon-dot" />
            {isOpen ? 'Open Issue' : 'Closed'}
          </span>

          <DifficultyBadge difficulty={difficulty} />
        </div>

        <div className="card-issue-identity">
          <div className="card-num-repo">
            <span>#{number}</span>
            <span>•</span>
            <span>{repository}</span>
          </div>
          <h3 className="card-issue-title">{title}</h3>
        </div>

        {labels.length > 0 && (
          <div className="card-tags-cloud">
            {labels.map((lbl, idx) => (
              <span key={idx} className="card-label-chip">
                {lbl}
              </span>
            ))}
          </div>
        )}

        <div className="card-scores-row">
          <ScoreBadge score={quality_score} label="Quality" size="small" />
          <ScoreBadge score={skill_match} label="Skill Match" size="small" />
          <ScoreBadge score={final_score} label="Overall Match" size="small" />
        </div>

        {reason && (
          <div className="card-reason-box">
            <strong>Why it fits: </strong>
            <span>{reason}</span>
          </div>
        )}

        <div className="card-footer-action">
          <button
            type="button"
            className="card-understand-btn"
            onClick={() => setShowBreakdown(true)}
            title="Get maintainer-level guidance & breakdown"
          >
            <Sparkles size={13} />
            <span>Understand this issue</span>
          </button>

          {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer"
              className="card-view-btn"
            >
              <span>View on GitHub</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>No URL available</span>
          )}
        </div>
      </article>

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
