import { useState } from 'react'
import { GitBranch, CheckCircle2, AlertCircle, ArrowRight, Link2 } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'

export default function RepositoryConnectPanel({ onRepoConnected }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [connected, setConnected] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleConnect = (e) => {
    e?.preventDefault()
    if (!url.trim()) return

    const parsed = parseGitHubRepoUrl(url)
    if (!parsed) {
      setStatus('error')
      setErrorMessage(
        'Please enter a valid public GitHub repository URL (e.g. https://github.com/fastapi/fastapi)'
      )
      return
    }

    setErrorMessage('')
    setStatus('success')
    setConnected(parsed)
    onRepoConnected({ owner: parsed.owner, repo: parsed.repo })
  }

  const handleInputChange = (e) => {
    setUrl(e.target.value)
    if (status) {
      setStatus(null)
      setErrorMessage('')
    }
  }

  return (
    <>
      <style>{`
        .repo-connect-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 22px;
          box-shadow: var(--shadow-sm);
        }

        .repo-connect-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .repo-connect-desc {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .repo-connect-input-group {
          position: relative;
          margin-bottom: 12px;
        }

        .repo-connect-input {
          width: 100%;
          height: 38px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 12px 0 34px;
          font-size: 13px;
          color: var(--text);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .repo-connect-input::placeholder {
          color: var(--muted);
          opacity: 0.65;
        }

        .repo-connect-input:focus {
          outline: none;
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px var(--primary-muted);
        }

        .repo-connect-input.error {
          border-color: var(--danger);
        }

        .repo-input-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .connect-action-btn {
          width: 100%;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .connect-action-btn:hover:not(:disabled) {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .connect-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .repo-status-alert {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          margin-top: 12px;
          line-height: 1.45;
        }

        .repo-status-alert.success {
          background: var(--success-muted);
          color: var(--success);
          border: 1px solid var(--success-border);
        }

        .repo-status-alert.error {
          background: var(--danger-muted);
          color: var(--danger);
          border: 1px solid var(--danger-border);
        }
      `}</style>

      <div className="repo-connect-card">
        <h3 className="repo-connect-title">
          <GitBranch size={17} style={{ color: 'var(--primary)' }} />
          Connect your GitHub repository to IssueFit
        </h3>
        <p className="repo-connect-desc">
          Add a repository from GitHub by pasting the link to that repository.
        </p>

        <form onSubmit={handleConnect}>
          <div className="repo-connect-input-group">
            <Link2 size={14} className="repo-input-icon" />
            <input
              type="url"
              className={`repo-connect-input${status === 'error' ? ' error' : ''}`}
              placeholder="https://github.com/fastapi/fastapi"
              value={url}
              onChange={handleInputChange}
              aria-label="GitHub repository URL"
            />
          </div>

          <button
            type="submit"
            className="connect-action-btn"
            disabled={!url.trim()}
          >
            <span>Connect Repository</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {status === 'success' && connected && (
          <div className="repo-status-alert success" role="status">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Connected: </strong>
              <span>
                {connected.owner}/{connected.repo}
              </span>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                Search form pre-filled with this repository.
              </div>
            </div>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="repo-status-alert error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </>
  )
}
