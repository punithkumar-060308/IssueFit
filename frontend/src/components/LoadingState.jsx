import { Compass, Sparkles } from 'lucide-react'

export default function LoadingState({ message = 'Analyzing repository & finding suitable issues...' }) {
  return (
    <>
      <style>{`
        .loading-radar-chamber {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          gap: 20px;
          text-align: center;
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          margin-top: 24px;
          box-shadow: var(--shadow-glass);
        }

        .radar-spinner-core {
          width: 54px;
          height: 54px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radar-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--primary);
          border-right-color: var(--accent-cyan);
          animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .radar-ring-inner {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-bottom-color: #a855f7;
          animation: spin 0.7s linear infinite reverse;
        }

        .radar-pulse-center {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 12px var(--primary);
        }

        .loading-radar-text {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .loading-sub-beacon {
          font-size: 12px;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      <div className="loading-radar-chamber" role="status" aria-live="polite">
        <div className="radar-spinner-core">
          <div className="radar-ring" />
          <div className="radar-ring-inner" />
          <div className="radar-pulse-center" />
        </div>

        <div>
          <p className="loading-radar-text">{message}</p>
          <div className="loading-sub-beacon">
            <Sparkles size={13} style={{ color: 'var(--primary)' }} />
            <span>Calculating quality metrics & skill suitability scores</span>
          </div>
        </div>
      </div>
    </>
  )
}
