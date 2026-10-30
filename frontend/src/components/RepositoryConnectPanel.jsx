import { useState } from 'react'
import { GitBranch, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'

export default function RepositoryConnectPanel({ onRepoConnected }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [connected, setConnected] = useState(null)
  const [inputError, setInputError] = useState('')

  const handleConnect = () => {
    if (!url.trim()) return
    const parsed = parseGitHubRepoUrl(url)
    if (!parsed) {
      setStatus('error')
      setInputError('Enter a valid public GitHub URL, e.g. https://github.com/owner/repo')
      return
    }
    setInputError('')
    setStatus('success')
    setConnected(parsed)
    onRepoConnected({ owner: parsed.owner, repo: parsed.repo })
  }

  const handleChange = (e) => {
    setUrl(e.target.value)
    if (status) { setStatus(null); setInputError('') }
  }

  return (
    <>
      <style>{`
        .rcp { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .rcp-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; display: flex; align-items: center; gap: 7px; }
        .rcp-desc { font-size: 12px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
        .rcp-input {
          background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 9px 12px; color: var(--text); font-size: 13px; width: 100%;
          margin-bottom: 10px; transition: border-color 0.15s;
        }
        .rcp-input::placeholder { color: var(--muted); opacity: 0.65; }
        .rcp-input:focus { outline: none; border-color: var(--primary); }
        .rcp-input.rcp-err { border-color: var(--danger); }
        .rcp-field-err { font-size: 11px; color: var(--danger); margin-top: -6px; margin-bottom: 8px; line-height: 1.4; }
        .rcp-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; background: var(--primary); color: #fff; border: none;
          border-radius: var(--radius-sm); padding: 9px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .rcp-btn:hover:not(:disabled) { background: var(--primary-hover); }
        .rcp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rcp-status {
          display: flex; align-items: center; gap: 8px; margin-top: 12px;
          padding: 10px 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 500;
        }
        .rcp-status.success { background: var(--success-muted); color: var(--success); border: 1px solid rgba(53,201,138,0.25); }
        .rcp-status.error { background: var(--danger-muted); color: var(--danger); border: 1px solid rgba(240,113,120,0.25); }
      `}</style>
      <div className="rcp">
        <p className="rcp-title">
          <GitBranch size={14} />
          Connect your GitHub repository to IssueFit
        </p>
        <p className="rcp-desc">
          Add a repository from GitHub by pasting the link to that repository.
        </p>
        <input
          type="url"
          className={`rcp-input${status === 'error' ? ' rcp-err' : ''}`}
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          aria-label="GitHub repository URL"
        />
        {inputError && <p className="rcp-field-err">{inputError}</p>}
        <button className="rcp-btn" onClick={handleConnect} disabled={!url.trim()}>
          <ArrowRight size={14} />
          Connect Repository
        </button>
        {status === 'success' && connected && (
          <div className="rcp-status success">
            <CheckCircle2 size={14} />
            Connected: <strong>{connected.owner}/{connected.repo}</strong>
          </div>
        )}
      </div>
    </>
  )
}

