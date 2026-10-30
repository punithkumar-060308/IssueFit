import { useState } from 'react'
import { GitBranch, CheckCircle2, AlertCircle, ArrowRight, Link2, Star, Code2, Loader2, GitFork, Radio } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'
import { validateRepository } from '../services/issuefitApi'

export default function RepositoryConnectPanel({ onRepoConnected }) {
  const [url, setUrl] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [status, setStatus] = useState(null)
  const [repoInfo, setRepoInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleConnect = async (e) => {
    e?.preventDefault()
    if (!url.trim()) return

    const clientParsed = parseGitHubRepoUrl(url)
    if (!clientParsed) {
      setStatus('error')
      setErrorMessage(
        'Please enter a valid GitHub repository URL (e.g. github.com/fastapi/fastapi)'
      )
      return
    }

    setIsValidating(true)
    setStatus(null)
    setErrorMessage('')

    try {
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
        .station-card {
          background: var(--surface);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 24px;
          box-shadow: var(--shadow-glass);
          position: relative;
          overflow: hidden;
        }

        .station-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .station-icon-glow {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--primary-muted);
          border: 1px solid var(--border-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }

        .station-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
        }

        .station-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 18px;
          line-height: 1.5;
        }

        .station-input-wrap {
          position: relative;
          margin-bottom: 10px;
        }

        .station-input {
          width: 100%;
          height: 42px;
          background: var(--surface-solid);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 14px 0 38px;
          font-size: 13px;
          color: var(--text);
          transition: all 0.2s ease;
        }

        .station-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .station-input.input-error {
          border-color: var(--danger);
        }

        .station-input-ico {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-subtle);
          pointer-events: none;
        }

        .station-example-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-subtle);
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .station-chip {
          background: var(--surface-card);
          border: 1px solid var(--border);
          color: var(--primary);
          padding: 2px 8px;
          border-radius: 9999px;
          font-family: 'JetBrains Mono', monospace;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .station-chip:hover {
          background: var(--primary-muted);
          border-color: var(--border-accent);
        }

        .station-action-btn {
          width: 100%;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--surface-card);
          border: 1px solid var(--border-bright);
          color: var(--text);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .station-action-btn:hover:not(:disabled) {
          background: var(--primary-gradient);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .station-action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Holographic Repo Preview */
        .holo-repo-card {
          margin-top: 16px;
          padding: 16px;
          border-radius: var(--radius);
          background: var(--surface-solid);
          border: 1px solid var(--success-border);
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: slideUpFade 0.25s ease;
        }

        .holo-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
        }

        .holo-desc {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .holo-stats-grid {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid var(--border);
          font-size: 11px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .holo-stat-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .holo-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          margin-top: 16px;
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid var(--danger-border);
          line-height: 1.45;
        }
      `}</style>

      <div className="station-card">
        <div className="station-header">
          <div className="station-icon-glow">
            <GitBranch size={17} />
          </div>
          <h3 className="station-title">Connect Repository</h3>
        </div>

        <p className="station-desc">
          Paste any public GitHub repository link to inspect metadata and prefill discovery.
        </p>

        <form onSubmit={handleConnect}>
          <div className="station-input-wrap">
            <Link2 size={15} className="station-input-ico" />
            <input
              type="text"
              className={`station-input${status === 'error' ? ' input-error' : ''}`}
              placeholder="github.com/owner/repository"
              value={url}
              onChange={handleInputChange}
              disabled={isValidating}
              aria-label="Repository URL Input"
            />
          </div>

          <div className="station-example-row">
            <span>Example:</span>
            <button
              type="button"
              className="station-chip"
              onClick={() => applyExample('https://github.com/fastapi/fastapi')}
            >
              fastapi/fastapi
            </button>
            <button
              type="button"
              className="station-chip"
              onClick={() => applyExample('https://github.com/psf/requests')}
            >
              psf/requests
            </button>
          </div>

          <button
            type="submit"
            className="station-action-btn"
            disabled={!url.trim() || isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Validating with GitHub API...</span>
              </>
            ) : (
              <>
                <span>Inspect & Connect</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {status === 'success' && repoInfo && (
          <div className="holo-repo-card" role="status">
            <div className="holo-title-row">
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span>{repoInfo.full_name}</span>
            </div>

            {repoInfo.description && (
              <p className="holo-desc">{repoInfo.description}</p>
            )}

            <div className="holo-stats-grid">
              {repoInfo.language && (
                <span className="holo-stat-item">
                  <Code2 size={13} style={{ color: 'var(--accent-cyan)' }} />
                  {repoInfo.language}
                </span>
              )}
              {repoInfo.stargazers_count !== undefined && (
                <span className="holo-stat-item">
                  <Star size={13} style={{ color: 'var(--warning)' }} />
                  {repoInfo.stargazers_count.toLocaleString()}
                </span>
              )}
              {repoInfo.open_issues_count !== undefined && (
                <span className="holo-stat-item">
                  <Radio size={13} style={{ color: 'var(--success)' }} />
                  {repoInfo.open_issues_count} open
                </span>
              )}
            </div>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="holo-error-banner" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </>
  )
}
