import { formatScore } from '../utils/formatters'

export default function ScoreBadge({ score, label = 'Match Score', size = 'default' }) {
  const display = formatScore(score)
  const num = Number(score) || 0

  let color = 'var(--text-muted)'
  let glow = 'none'
  let bg = 'rgba(255, 255, 255, 0.05)'

  if (display !== 'N/A') {
    if (num >= 80) {
      color = '#10b981'
      glow = '0 0 12px rgba(16, 185, 129, 0.35)'
      bg = 'rgba(16, 185, 129, 0.12)'
    } else if (num >= 55) {
      color = '#f59e0b'
      glow = '0 0 12px rgba(245, 158, 11, 0.35)'
      bg = 'rgba(245, 158, 11, 0.12)'
    } else {
      color = '#f43f5e'
      glow = '0 0 12px rgba(244, 63, 94, 0.35)'
      bg = 'rgba(244, 63, 94, 0.12)'
    }
  }

  const isSmall = size === 'small'

  return (
    <>
      <style>{`
        .score-gauge-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .score-pill-core {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
          padding: ${isSmall ? '2px 8px' : '4px 10px'};
          border-radius: 9999px;
          font-weight: 800;
          font-size: ${isSmall ? '12px' : '14px'};
          line-height: 1;
          letter-spacing: -0.02em;
          border: 1px solid currentColor;
          box-shadow: ${glow};
          background: ${bg};
          color: ${color};
        }

        .score-pill-max {
          font-size: 9px;
          opacity: 0.7;
          font-weight: 600;
        }

        .score-gauge-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-subtle);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          white-space: nowrap;
        }
      `}</style>

      <div className="score-gauge-wrap" title={`${label}: ${display}/100`}>
        <div className="score-pill-core">
          <span>{display !== 'N/A' ? display : '—'}</span>
          {display !== 'N/A' && <span className="score-pill-max">/100</span>}
        </div>
        {label && <span className="score-gauge-label">{label}</span>}
      </div>
    </>
  )
}
