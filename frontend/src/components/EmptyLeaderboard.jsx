import { Trophy, Sparkles, Compass } from 'lucide-react'

export default function EmptyLeaderboard() {
  return (
    <>
      <style>{`
        .leaderboard-empty-station {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
          background: var(--surface);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px dashed var(--border-bright);
          border-radius: var(--radius-xl);
          margin-top: 12px;
          box-shadow: var(--shadow-glass);
        }

        .trophy-glow-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--warning);
          box-shadow: 0 0 24px rgba(245, 158, 11, 0.25);
          margin-bottom: 20px;
        }

        .leaderboard-empty-heading {
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .leaderboard-empty-text {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 440px;
          line-height: 1.6;
        }

        .leaderboard-sync-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          font-size: 12px;
          font-weight: 600;
          color: var(--primary);
          margin-top: 20px;
        }
      `}</style>

      <div className="leaderboard-empty-station">
        <div className="trophy-glow-icon">
          <Trophy size={32} />
        </div>
        <h3 className="leaderboard-empty-heading">Contributor Rankings Standing By</h3>
        <p className="leaderboard-empty-text">
          Rankings are calculated dynamically from verified merged pull requests and contribution metrics provided by the backend API.
        </p>
        <div className="leaderboard-sync-chip">
          <Sparkles size={14} />
          <span>Real-time Telemetry Enabled</span>
        </div>
      </div>
    </>
  )
}
