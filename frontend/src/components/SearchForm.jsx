import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, Sparkles, User, FolderGit2, Link2, Info } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'

const INITIAL = { username: '', owner: '', repo: '' }

const SAMPLE_PRESETS = [
  { username: 'octocat', owner: 'fastapi', repo: 'fastapi' },
  { username: 'torvalds', owner: 'psf', repo: 'requests' },
  { username: 'shadcn', owner: 'tailwindlabs', repo: 'tailwindcss' },
]

export default function SearchForm({ onSubmit, isLoading, prefill }) {
  const [values, setValues] = useState(prefill || INITIAL)
  const [touched, setTouched] = useState({})
  const [pastedUrl, setPastedUrl] = useState('')
  const prevPrefill = useRef(null)

  useEffect(() => {
    if (prefill && JSON.stringify(prefill) !== JSON.stringify(prevPrefill.current)) {
      prevPrefill.current = prefill
      setValues((v) => ({ ...v, ...prefill }))
    }
  }, [prefill])

  const errors = {
    username: touched.username && !values.username.trim() ? 'GitHub username is required.' : '',
    owner: touched.owner && !values.owner.trim() ? 'Repository owner is required.' : '',
    repo: touched.repo && !values.repo.trim() ? 'Repository name is required.' : '',
  }

  const handleFieldChange = (field) => (e) => {
    const val = e.target.value
    // If the user pastes a full GitHub URL into owner or repo, auto-split both
    if ((field === 'owner' || field === 'repo') && (val.includes('/') || val.includes('github.com'))) {
      const parsed = parseGitHubRepoUrl(val)
      if (parsed) {
        setValues((prev) => ({
          ...prev,
          owner: parsed.owner,
          repo: parsed.repo,
        }))
        return
      }
    }
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  const handleQuickUrlPaste = (e) => {
    const val = e.target.value
    setPastedUrl(val)
    const parsed = parseGitHubRepoUrl(val)
    if (parsed) {
      setValues((prev) => ({
        ...prev,
        owner: parsed.owner,
        repo: parsed.repo,
      }))
    }
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched({ username: true, owner: true, repo: true })
    if (!values.username.trim() || !values.owner.trim() || !values.repo.trim()) return
    onSubmit(values)
  }

  const applySample = (sample) => {
    setValues(sample)
    setTouched({})
    onSubmit(sample)
  }

  return (
    <>
      <style>{`
        .search-form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }

        .search-form-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-form-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }

        .search-form-subtitle {
          font-size: 13px;
          color: var(--muted);
        }

        .quick-presets {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .quick-preset-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-preset-btn {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 12px;
          background: var(--tag-bg);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .quick-preset-btn:hover {
          color: var(--primary);
          border-color: var(--primary-border);
          background: var(--primary-muted);
        }

        .quick-url-input-container {
          position: relative;
          margin-bottom: 18px;
        }

        .quick-url-input {
          width: 100%;
          height: 38px;
          background: var(--bg);
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 0 12px 0 34px;
          font-size: 13px;
          color: var(--text);
          transition: border-color 0.15s ease;
        }

        .quick-url-input:focus {
          outline: none;
          border-color: var(--border-active);
          border-style: solid;
        }

        .quick-url-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .form-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .field-input-box {
          position: relative;
        }

        .field-input {
          width: 100%;
          height: 40px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0 12px;
          color: var(--text);
          font-size: 13px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .field-input::placeholder {
          color: var(--muted);
          opacity: 0.6;
        }

        .field-input:focus {
          outline: none;
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px var(--primary-muted);
        }

        .field-input.has-error {
          border-color: var(--danger);
        }

        .field-error-msg {
          font-size: 11px;
          color: var(--danger);
        }

        .field-example-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--muted);
          background: var(--tag-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-xs);
          padding: 3px 8px;
          margin-top: 2px;
        }

        .field-example-tag strong {
          color: var(--primary);
          font-weight: 600;
        }

        .form-guide-banner {
          background: var(--tag-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 18px;
        }

        .guide-icon {
          color: var(--primary);
          flex-shrink: 0;
        }

        .guide-code-chip {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: ui-monospace, monospace;
          color: var(--primary);
          font-weight: 600;
        }

        .submit-search-btn {
          height: 42px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--primary);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .submit-search-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.45);
        }

        .submit-search-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 860px) {
          .form-fields-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}</style>

      <div className="search-form-card">
        <div className="search-form-header">
          <div>
            <h2 className="search-form-title">Find Your Next Contribution</h2>
            <p className="search-form-subtitle">
              Enter your GitHub details or paste a repository link below.
            </p>
          </div>

          <div className="quick-presets">
            <span className="quick-preset-label">
              <Sparkles size={11} style={{ display: 'inline', marginRight: 3 }} />
              Quick Try:
            </span>
            {SAMPLE_PRESETS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-preset-btn"
                onClick={() => applySample(sample)}
                disabled={isLoading}
              >
                {sample.owner}/{sample.repo}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="quick-url-input-container">
            <Link2 size={14} className="quick-url-icon" />
            <input
              type="text"
              className="quick-url-input"
              placeholder="Paste any GitHub URL (e.g. github.com/fastapi/fastapi) to auto-fill Owner and Name"
              value={pastedUrl}
              onChange={handleQuickUrlPaste}
              aria-label="Paste GitHub URL"
            />
          </div>

          <div className="form-fields-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="input-username">
                <User size={13} />
                <span>GitHub Username</span>
              </label>
              <div className="field-input-box">
                <input
                  id="input-username"
                  type="text"
                  className={`field-input${errors.username ? ' has-error' : ''}`}
                  placeholder="e.g. octocat"
                  value={values.username}
                  onChange={handleFieldChange('username')}
                  onBlur={handleBlur('username')}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="field-example-tag">
                <span>Example:</span>
                <strong>octocat</strong>
                <span>(your contributor profile)</span>
              </div>
              {errors.username && <span className="field-error-msg">{errors.username}</span>}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="input-owner">
                <FolderGit2 size={13} />
                <span>Repository Owner</span>
              </label>
              <div className="field-input-box">
                <input
                  id="input-owner"
                  type="text"
                  className={`field-input${errors.owner ? ' has-error' : ''}`}
                  placeholder="e.g. fastapi"
                  value={values.owner}
                  onChange={handleFieldChange('owner')}
                  onBlur={handleBlur('owner')}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="field-example-tag">
                <span>Example:</span>
                <strong>fastapi</strong>
                <span>(org / account name)</span>
              </div>
              {errors.owner && <span className="field-error-msg">{errors.owner}</span>}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="input-repo">
                <FolderGit2 size={13} />
                <span>Repository Name</span>
              </label>
              <div className="field-input-box">
                <input
                  id="input-repo"
                  type="text"
                  className={`field-input${errors.repo ? ' has-error' : ''}`}
                  placeholder="e.g. fastapi"
                  value={values.repo}
                  onChange={handleFieldChange('repo')}
                  onBlur={handleBlur('repo')}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="field-example-tag">
                <span>Example:</span>
                <strong>fastapi</strong>
                <span>(project repository)</span>
              </div>
              {errors.repo && <span className="field-error-msg">{errors.repo}</span>}
            </div>
          </div>

          <div className="form-guide-banner">
            <Info size={15} className="guide-icon" />
            <span>
              <strong>URL Formula: </strong>
              <span>github.com/</span>
              <span className="guide-code-chip">OWNER</span>
              <span>/</span>
              <span className="guide-code-chip">REPOSITORY</span>
              <span> &nbsp;➔&nbsp; e.g. For <em>github.com/fastapi/fastapi</em> enter Owner: <strong>fastapi</strong>, Repo: <strong>fastapi</strong></span>
            </span>
          </div>

          <button type="submit" className="submit-search-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Generating Recommendations...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Find Suitable Issues</span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  )
}
