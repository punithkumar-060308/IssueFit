import { formatScore, scoreColor } from '../utils/formatters'

export default function ScoreBadge({ score, label }) {
  const display = formatScore(score)
  const color = scoreColor(score)
  return (
    <>
      <style>{`
        .score-badge { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .score-label { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
        .score-value { font-size: 16px; font-weight: 800; line-height: 1; }
        .score-unit { font-size: 10px; font-weight: 500; color: var(--muted); }
      `}</style>
      <div className="score-badge" title={`${label}: ${display}/100`}>
        <span className="score-label">{label}</span>
        <span className="score-value" style={{ color }}>
          {display !== 'N/A' ? display : '—'}
        </span>
        {display !== 'N/A' && <span className="score-unit">/100</span>}
      </div>
    </>
  )
}

