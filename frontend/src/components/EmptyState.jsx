import { SearchX } from 'lucide-react'

export default function EmptyState({ title, description }) {
  return (
    <>
      <style>{`
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          padding: 72px 20px; gap: 12px; text-align: center;
        }
        .empty-icon { opacity: 0.3; color: var(--muted); }
        .empty-title { font-size: 16px; font-weight: 700; color: var(--text); }
        .empty-desc { font-size: 14px; color: var(--muted); max-width: 420px; line-height: 1.6; }
      `}</style>
      <div className="empty-state" role="status">
        <SearchX size={44} className="empty-icon" />
        <p className="empty-title">{title || 'No suitable issues found'}</p>
        <p className="empty-desc">
          {description ||
            'No suitable issues found for this search. Try another repository or contributor profile.'}
        </p>
      </div>
    </>
  )
}

