import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, Sparkles, User, FolderGit2, Link2, ArrowRight, CornerDownLeft, Terminal } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'

const INITIAL = { username: '', owner: '', repo: '' }

const FEATURED_PRESETS = [
  { name: 'FastAPI', username: 'octocat', owner: 'fastapi', repo: 'fastapi', lang: 'Python' },
  { name: 'Requests', username: 'torvalds', owner: 'psf', repo: 'requests', lang: 'Python' },
  { name: 'Tailwind CSS', username: 'shadcn', owner: 'tailwindlabs', repo: 'tailwindcss', lang: 'JavaScript' },
  { name: 'Supabase', username: 'octocat', owner: 'supabase', repo: 'supabase', lang: 'TypeScript' },
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
    username: touched.username && !values.username.trim() ? 'Contributor username is required' : '',
    owner: touched.owner && !values.owner.trim() ? 'Repository owner is required' : '',
    repo: touched.repo && !values.repo.trim() ? 'Repository name is required' : '',
  }

  const handleFieldChange = (field) => (e) => {
    const val = e.target.value
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

  const applyPreset = (preset) => {
    const data = {
      username: preset.username,
      owner: preset.owner,
      repo: preset.repo,
    }
    setValues(data)
    setTouched({})
    onSubmit(data)
  }

  return (
    <>
      <style>{`
        .match-console-card {
          background: var(--surface);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 30px;
          box-shadow: var(--shadow-glass);
          position: relative;
          overflow: hidden;
        }

        .match-console-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary-gradient);
        }

        .console-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .console-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .console-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--primary);
        }

        .console-heading {
          font-size: 22px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
        }

        .presets-belt {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .preset-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .preset-pill:hover {
          background: var(--surface-hover);
          border-color: var(--border-accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .preset-lang-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-cyan);
        }

        /* Unified Smart Input Container */
        .url-omni-bar {
          position: relative;
          margin-bottom: 20px;
        }

        .url-omni-input {
          width: 100%;
          height: 46px;
          background: var(--surface-solid);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0 16px 0 42px;
          font-size: 14px;
          color: var(--text);
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .url-omni-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-glow);
        }

        .url-omni-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        /* Bento Fields Grid */
        .fields-bento-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 22px;
        }

        .bento-field-box {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bento-field-box:focus-within {
          border-color: var(--primary);
          background: var(--surface-hover);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .bento-field-box.has-error {
          border-color: var(--danger);
        }

        .bento-field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bento-field-input {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 14px;
          font-weight: 600;
          padding: 0;
        }

        .bento-field-input:focus {
          outline: none;
        }

        .bento-field-input::placeholder {
          color: var(--text-subtle);
          font-weight: 400;
        }

        .bento-hint-text {
          font-size: 11px;
          color: var(--text-subtle);
          margin-top: 2px;
        }

        .bento-field-error {
          font-size: 11px;
          color: var(--danger);
        }

        /* Submit Action Button */
        .submit-radar-btn {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--primary-gradient);
          color: #ffffff;
          border: none;
          border-radius: var(--radius);
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .submit-radar-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
        }

        .submit-radar-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .kbd-chip {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
        }

        @media (max-width: 900px) {
          .fields-bento-grid {
            grid-template-columns: 1fr;
          }
          .match-console-card {
            padding: 20px;
          }
        }
      `}</style>

      <div className="match-console-card">
        <div className="console-top-row">
          <div className="console-title-wrap">
            <span className="console-badge">
              <Sparkles size={13} />
              AI-Powered Match Engine
            </span>
            <h2 className="console-heading">Discover Tailored Issues</h2>
          </div>

          <div className="presets-belt">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Quick Try:
            </span>
            {FEATURED_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-pill"
                onClick={() => applyPreset(preset)}
                disabled={isLoading}
              >
                <span className="preset-lang-dot" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="url-omni-bar">
            <Link2 size={16} className="url-omni-icon" />
            <input
              type="text"
              className="url-omni-input"
              placeholder="Paste any GitHub URL (e.g. https://github.com/fastapi/fastapi) to auto-fill"
              value={pastedUrl}
              onChange={handleQuickUrlPaste}
              aria-label="GitHub Repository URL Omnibar"
            />
          </div>

          <div className="fields-bento-grid">
            <div className={`bento-field-box${errors.username ? ' has-error' : ''}`}>
              <label className="bento-field-label" htmlFor="input-username">
                <span>1. Contributor</span>
                <User size={13} />
              </label>
              <input
                id="input-username"
                type="text"
                className="bento-field-input"
                placeholder="e.g. octocat"
                value={values.username}
                onChange={handleFieldChange('username')}
                onBlur={handleBlur('username')}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="bento-hint-text">Your GitHub profile handle</span>
              {errors.username && <span className="bento-field-error">{errors.username}</span>}
            </div>

            <div className={`bento-field-box${errors.owner ? ' has-error' : ''}`}>
              <label className="bento-field-label" htmlFor="input-owner">
                <span>2. Repo Owner</span>
                <FolderGit2 size={13} />
              </label>
              <input
                id="input-owner"
                type="text"
                className="bento-field-input"
                placeholder="e.g. fastapi"
                value={values.owner}
                onChange={handleFieldChange('owner')}
                onBlur={handleBlur('owner')}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="bento-hint-text">Organization or creator</span>
              {errors.owner && <span className="bento-field-error">{errors.owner}</span>}
            </div>

            <div className={`bento-field-box${errors.repo ? ' has-error' : ''}`}>
              <label className="bento-field-label" htmlFor="input-repo">
                <span>3. Project Name</span>
                <FolderGit2 size={13} />
              </label>
              <input
                id="input-repo"
                type="text"
                className="bento-field-input"
                placeholder="e.g. fastapi"
                value={values.repo}
                onChange={handleFieldChange('repo')}
                onBlur={handleBlur('repo')}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="bento-hint-text">Specific repository name</span>
              {errors.repo && <span className="bento-field-error">{errors.repo}</span>}
            </div>
          </div>

          <button type="submit" className="submit-radar-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Scanning Repository & Matching Skills...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Calculate & Discover Match Rankings</span>
                <span className="kbd-chip">
                  <CornerDownLeft size={11} /> ↵
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  )
}
