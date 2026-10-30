import { useState } from 'react'
import { GitBranch, CheckCircle2, AlertCircle, ArrowRight, Link2, Star, Code2, Loader2, Sparkles } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'
import { validateRepository } from '../services/issuefitApi'

export default function RepositoryConnectPanel({ onRepoConnected }) {
  const [url, setUrl] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [repoInfo, setRepoInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleConnect = async (e) => {
    e?.preventDefault()
    if (!url.trim()) return

    const clientParsed = parseGitHubRepoUrl(url)
    if (!clientParsed) {
      setStatus('error')
      setErrorMessage(
        'Please enter a valid public GitHub repository URL (e.g. github.com/fastapi/fastapi)'
      )
      return
    }

    setIsValidating(true)
    setStatus(null)
    setErrorMessage('')

    try {
      // Validate with backend API endpoint /api/repository/validate
      const data = await validateRepository(url)
      const repo = data?.repository || {}
      setStatus('success')
      setRepoInfo(repo)
      onRepoConnected({
        owner: clientParsed.owner,
        repo: clientParsed.repo,
        metadata: repo,
      })
    } catch (err) {
      setStatus('error')
      setErrorMessage(err.message || 'The repository could not be found or accessed on GitHub.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleInputChange = (e) => {
    setUrl(e.target.value)
    if (status) {
      setStatus(null)
      setErrorMessage('')
    }
  }

  const applyExample = (exampleUrl) => {
    setUrl(exampleUrl)
    setStatus(null)
    setErrorMessage('')
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
          margin-bottom: 6px;
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

        .repo-example-helper {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .example-chip-link {
          background: var(--tag-bg);
          border: 1px solid var(--border);
          color: var(--primary);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: ui-monospace, monospace;
          cursor: pointer;
          font-size: 11px;
        }

        .example-chip-link:hover {
          background: var(--primary-muted);
          border-color: var(--primary-border);
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
          opacity: 0.55;
          cursor: not-allowed;
        }

        .repo-status-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          margin-top: 14px;
          line-height: 1.5;
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

        .repo-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .repo-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 3px;
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
              type="text"
              className={`repo-connect-input${status === 'error' ? ' error' : ''}`}
              placeholder="e.g. github.com/fastapi/fastapi"
              value={url}
              onChange={handleInputChange}
              disabled={isValidating}
              aria-label="GitHub repository URL"
            />
          </div>

          <div className="repo-example-helper">
            <span>Example:</span>
            <button
              type="button"
              className="example-chip-link"
              onClick={() => applyExample('https://github.com/fastapi/fastapi')}
            >
              github.com/fastapi/fastapi
            </button>
          </div>

          <button
            type="submit"
            className="connect-action-btn"
            disabled={!url.trim() || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Validating with GitHub...</span>
              </>
            ) : (
              <>
                <span>Connect Repository</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {status === 'success' && repoInfo && (
          <div className="repo-status-alert success" role="status">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: 13, color: 'var(--text)' }}>
                {repoInfo.full_name || 'Connected'}
              </strong>
              {repoInfo.description && (
                <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                  {repoInfo.description}
                </div>
              )}
              <div className="repo-meta-row">
                {repoInfo.language && (
                  <span className="repo-meta-item">
                    <Code2 size={12} />
                    {repoInfo.language}
                  </span>
                )}
                {repoInfo.stargazers_count !== undefined && (
                  <span className="repo-meta-item">
                    <Star size={12} />
                    {repoInfo.stargazers_count.toLocaleString()} stars
                  </span>
                )}
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
