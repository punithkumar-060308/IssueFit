import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <>
      <style>{`
        .error-radar-alert {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: var(--danger-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--danger-border);
          border-radius: var(--radius);
          padding: 18px 20px;
          margin-top: 16px;
          animation: slideUpFade 0.2s ease;
          box-shadow: 0 4px 20px var(--danger-glow);
        }

        .error-alert-ico {
          color: var(--danger);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .error-alert-content {
          flex: 1;
        }

        .error-alert-heading {
          font-size: 14px;
          font-weight: 800;
          color: var(--danger);
          margin-bottom: 4px;
        }

        .error-alert-body {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .error-retry-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid var(--danger-border);
          color: var(--danger);
          border-radius: var(--radius-sm);
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          margin-top: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .error-retry-action:hover {
          background: var(--danger);
          color: #ffffff;
          box-shadow: 0 2px 10px var(--danger-glow);
        }
      `}</style>

      <div className="error-radar-alert" role="alert">
        <AlertTriangle size={20} className="error-alert-ico" />
        <div className="error-alert-content">
          <p className="error-alert-heading">Connection Notice</p>
          <p className="error-alert-body">
            {message || 'An unexpected condition occurred while communicating with GitHub or the API.'}
          </p>
          {onRetry && (
            <button className="error-retry-action" onClick={onRetry}>
              <RefreshCw size={13} />
              <span>Retry Search</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
