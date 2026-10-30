import { formatDifficulty, difficultyColor } from '../utils/formatters'

export default function DifficultyBadge({ difficulty }) {
  const label = formatDifficulty(difficulty)
  const color = difficultyColor(difficulty)

  return (
    <>
      <style>{`
        .diff-tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          border: 1px solid currentColor;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .diff-tag-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }
      `}</style>

      <span
        className="diff-tag-badge"
        style={{
          color,
          borderColor: color,
          backgroundColor: `${color}18`,
        }}
        title={`Estimated Difficulty: ${label}`}
      >
        <span className="diff-tag-dot" />
        <span>{label}</span>
      </span>
    </>
  )
}
