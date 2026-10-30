import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <>
      <style>{`
        .error-msg {
          display: flex; align-items: flex-start; gap: 12px;
          background: var(--danger-muted); border: 1px solid var(--danger);
          border-radius: var(--radius); padding: 16px; margin-bottom: 16px;
          animation: fadeIn 0.2s ease;
        }
        .error-msg-icon { color: var(--danger); flex-shrink: 0; margin-top: 1px; }
        .error-msg-body { flex: 1; }
        .error-msg-title { font-size: 14px; font-weight: 700; color: var(--danger); margin-bottom: 4px; }
        .error-msg-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .error-retry {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: 1px solid var(--danger); color: var(--danger);
          border-radius: var(--radius-sm); padding: 5px 12px;
          font-size: 12px; font-weight: 600; margin-top: 10px; cursor: pointer;
          transition: background 0.15s;
        }
        .error-retry:hover { background: var(--danger-muted); }
      `}</style>
      <div className="error-msg" role="alert">
        <AlertTriangle size={18} className="error-msg-icon" />
        <div className="error-msg-body">
          <p className="error-msg-title">Something went wrong</p>
          <p className="error-msg-text">{message || 'An unexpected error occurred. Please try again.'}</p>
          {onRetry && (
            <button className="error-retry" onClick={onRetry}>
              <RefreshCw size={12} /> Try again
            </button>
          )}
        </div>
      </div>
    </>
  )
}

