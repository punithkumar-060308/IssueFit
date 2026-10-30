import { SearchX, FilterX } from 'lucide-react'

export default function EmptyState({ title, description }) {
  return (
    <>
      <style>{`
        .empty-radar-chamber {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 16px;
          text-align: center;
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px dashed var(--border-bright);
          border-radius: var(--radius-xl);
          margin-top: 24px;
          box-shadow: var(--shadow-glass);
        }

        .empty-icon-capsule {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .empty-chamber-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .empty-chamber-desc {
          font-size: 13.5px;
          color: var(--text-muted);
          max-width: 440px;
          line-height: 1.6;
        }
      `}</style>

      <div className="empty-radar-chamber" role="status">
        <div className="empty-icon-capsule">
          <SearchX size={26} />
        </div>
        <h3 className="empty-chamber-title">{title || 'No Matching Issues Detected'}</h3>
        <p className="empty-chamber-desc">
          {description ||
            'No suitable open issues found for this search. Try analyzing another repository or adjusting your filters.'}
        </p>
      </div>
    </>
  )
}
