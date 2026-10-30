import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, Sparkles, User, FolderGit2 } from 'lucide-react'

const INITIAL = { username: '', owner: '', repo: '' }

const SAMPLE_PRESETS = [
  { username: 'octocat', owner: 'fastapi', repo: 'fastapi' },
  { username: 'torvalds', owner: 'psf', repo: 'requests' },
  { username: 'shadcn', owner: 'tailwindlabs', repo: 'tailwindcss' },
]

export default function SearchForm({ onSubmit, isLoading, prefill }) {
  const [values, setValues] = useState(prefill || INITIAL)
  const [touched, setTouched] = useState({})
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
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
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

        .form-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
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
            gap: 12px;
          }
        }
      `}</style>

      <div className="search-form-card">
        <div className="search-form-header">
          <div>
            <h2 className="search-form-title">Find Your Next Contribution</h2>
            <p className="search-form-subtitle">
              Enter your GitHub details to discover personalized issue recommendations.
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
          <div className="form-fields-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="input-username">
                <User size={13} />
                GitHub Username
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
              {errors.username && <span className="field-error-msg">{errors.username}</span>}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="input-owner">
                <FolderGit2 size={13} />
                Repository Owner
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
              {errors.owner && <span className="field-error-msg">{errors.owner}</span>}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="input-repo">
                <FolderGit2 size={13} />
                Repository Name
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
              {errors.repo && <span className="field-error-msg">{errors.repo}</span>}
            </div>
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
