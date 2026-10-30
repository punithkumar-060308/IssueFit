import { formatScore, scoreColor } from '../utils/formatters'

export default function ScoreBadge({ score, label = 'Score' }) {
  const display = formatScore(score)
  const color = scoreColor(score)

  return (
    <>
      <style>{`
        .score-pill-container {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .score-pill-badge {
          display: inline-flex;
          align-items: baseline;
          gap: 1px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          line-height: 1.2;
          background: var(--tag-bg);
          border: 1px solid var(--border);
        }

        .score-pill-max {
          font-size: 10px;
          color: var(--muted);
          font-weight: 500;
        }

        .score-pill-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
      `}</style>

      <div className="score-pill-container" title={`${label}: ${display}/100`}>
        <div className="score-pill-badge" style={{ color }}>
          <span>{display !== 'N/A' ? display : '—'}</span>
          {display !== 'N/A' && <span className="score-pill-max">/100</span>}
        </div>
        {label && <span className="score-pill-label">{label}</span>}
      </div>
    </>
  )
}
