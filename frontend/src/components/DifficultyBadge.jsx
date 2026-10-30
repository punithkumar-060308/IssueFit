import { formatDifficulty } from '../utils/formatters'

export default function DifficultyBadge({ difficulty }) {
  const label = formatDifficulty(difficulty)

  let color = 'var(--text-muted)'
  let bg = 'rgba(255, 255, 255, 0.05)'
  let border = 'var(--border)'

  if (label === 'Easy') {
    color = '#10b981'
    bg = 'rgba(16, 185, 129, 0.12)'
    border = 'rgba(16, 185, 129, 0.3)'
  } else if (label === 'Medium') {
    color = '#f59e0b'
    bg = 'rgba(245, 158, 11, 0.12)'
    border = 'rgba(245, 158, 11, 0.3)'
  } else if (label === 'Hard') {
    color = '#f43f5e'
    bg = 'rgba(244, 63, 94, 0.12)'
    border = 'rgba(244, 63, 94, 0.3)'
  }

  return (
    <>
      <style>{`
        .diff-capsule-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid ${border};
          background: ${bg};
          color: ${color};
          white-space: nowrap;
          flex-shrink: 0;
        }

        .diff-capsule-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 6px currentColor;
        }
      `}</style>

      <span className="diff-capsule-badge" title={`Estimated Difficulty: ${label}`}>
        <span className="diff-capsule-dot" />
        <span>{label}</span>
      </span>
    </>
  )
}
