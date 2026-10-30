import { BarChart3 } from 'lucide-react'

export default function EmptyLeaderboard() {
  return (
    <>
      <style>{`
        .empty-lb {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 20px; gap: 14px; text-align: center;
        }
        .empty-lb-icon { opacity: 0.25; color: var(--muted); }
        .empty-lb-title { font-size: 18px; font-weight: 700; color: var(--text); }
        .empty-lb-desc { font-size: 14px; color: var(--muted); max-width: 380px; line-height: 1.6; }
      `}</style>
      <div className="empty-lb">
        <BarChart3 size={52} className="empty-lb-icon" />
        <p className="empty-lb-title">Leaderboard Coming Soon</p>
        <p className="empty-lb-desc">
          The leaderboard will appear when contribution data is available from the backend.
        </p>
      </div>
    </>
  )
}

