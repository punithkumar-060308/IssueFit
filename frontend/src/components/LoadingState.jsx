export default function LoadingState({ message = 'Finding suitable issues…' }) {
  return (
    <>
      <style>{`
        .loading-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 72px 20px; gap: 16px;
        }
        .loading-spinner {
          width: 38px; height: 38px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .loading-text { font-size: 14px; font-weight: 500; color: var(--muted); }
      `}</style>
      <div className="loading-state" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true" />
        <p className="loading-text">{message}</p>
      </div>
    </>
  )
}

