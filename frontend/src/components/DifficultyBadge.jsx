import { formatDifficulty, difficultyColor } from '../utils/formatters'

export default function DifficultyBadge({ difficulty }) {
  const label = formatDifficulty(difficulty)
  const color = difficultyColor(difficulty)
  return (
    <>
      <style>{`
        .difficulty-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1.5px solid currentColor;
          white-space: nowrap;
          flex-shrink: 0;
        }
      `}</style>
      <span
        className="difficulty-badge"
        style={{ color, borderColor: color, background: `${color}18` }}
        title={`Difficulty: ${label}`}
      >
        {label}
      </span>
    </>
  )
}

