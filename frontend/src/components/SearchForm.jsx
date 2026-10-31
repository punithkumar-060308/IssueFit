import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, Sparkles, User, FolderGit2, Link2, ArrowRight, CornerDownLeft, Terminal, CheckCircle2 } from 'lucide-react'
import { parseGitHubRepoUrl } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const INITIAL = { username: '', owner: '', repo: '' }

const FEATURED_PRESETS = [
  { name: 'FastAPI', username: 'octocat', owner: 'fastapi', repo: 'fastapi', lang: 'Python' },
  { name: 'Requests', username: 'torvalds', owner: 'psf', repo: 'requests', lang: 'Python' },
  { name: 'Tailwind CSS', username: 'shadcn', owner: 'tailwindlabs', repo: 'tailwindcss', lang: 'JavaScript' },
  { name: 'Supabase', username: 'octocat', owner: 'supabase', repo: 'supabase', lang: 'TypeScript' },
]

export default function SearchForm({ onSubmit, isLoading, prefill }) {
  const { user } = useAuth()
  const profileUsername = user?.github?.username || user?.github_username || ''

  const [values, setValues] = useState(() => ({
    username: prefill?.username || profileUsername || '',
    owner: prefill?.owner || '',
    repo: prefill?.repo || '',
  }))

  const [touched, setTouched] = useState({})
  const [pastedUrl, setPastedUrl] = useState('')
  const prevPrefill = useRef(null)

  useEffect(() => {
    if (prefill && JSON.stringify(prefill) !== JSON.stringify(prevPrefill.current)) {
      prevPrefill.current = prefill
      setValues((v) => ({
        ...v,
        ...prefill,
        username: prefill.username || v.username || profileUsername,
      }))
    }
  }, [prefill, profileUsername])

  useEffect(() => {
    if (profileUsername && !values.username) {
      setValues((v) => ({ ...v, username: profileUsername }))
    }
  }, [profileUsername])

  const effectiveUsername = values.username.trim() || profileUsername.trim()
  const errors = {
    username: touched.username && !effectiveUsername ? 'Contributor username is required' : '',
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
    const activeUsername = values.username.trim() || profileUsername.trim()
    setTouched({ username: true, owner: true, repo: true })
    if (!activeUsername || !values.owner.trim() || !values.repo.trim()) return
    onSubmit({
      ...values,
      username: activeUsername,
    })
  }

  const applyPreset = (preset) => {
    const data = {
      username: profileUsername || preset.username,
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
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .preset-pill:hover {
          color: var(--text);
          background: var(--surface-hover);
          border-color: var(--border-bright);
          transform: translateY(-1px);
        }

        .preset-lang-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .url-omni-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface-card);
          border: 1px dashed var(--border-bright);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          margin-bottom: 20px;
          transition: all 0.2s ease;
        }

        .url-omni-bar:focus-within {
          border-color: var(--primary);
          border-style: solid;
          background: var(--surface-hover);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .url-omni-icon {
          color: var(--text-subtle);
          flex-shrink: 0;
        }

        .url-omni-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 13px;
          font-family: inherit;
        }

        .url-omni-input::placeholder {
          color: var(--text-subtle);
        }

        .fields-bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 860px) {
          .fields-bento-grid {
            grid-template-columns: 1fr;
          }
        }

        .bento-field-box {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
          position: relative;
        }

        .bento-field-box:focus-within {
          border-color: var(--primary);
          background: var(--surface-hover);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .bento-field-box.has-error {
          border-color: var(--danger);
          box-shadow: 0 0 0 2px var(--danger-glow);
        }

        .bento-field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--text-muted);
        }

        .bento-field-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          width: 100%;
        }

        .bento-field-input::placeholder {
          color: var(--text-subtle);
          font-weight: 400;
        }

        .bento-hint-text {
          font-size: 11px;
          color: var(--text-subtle);
        }

        .bento-field-error {
          font-size: 11px;
          color: var(--danger);
          font-weight: 500;
        }

        .submit-radar-btn {
          width: 100%;
          height: 48px;
          background: var(--primary-gradient);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius);
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 18px rgba(99, 102, 241, 0.4);
        }

        .submit-radar-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(99, 102, 241, 0.55);
        }

        .submit-radar-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .kbd-chip {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
      `}</style>

      <div className="match-console-card">
        <div className="console-top-row">
          <div className="console-title-wrap">
            <div className="console-badge">
              <Sparkles size={13} />
              <span>Personalized Matching</span>
            </div>
            <h2 className="console-heading">Discover Good First Issues</h2>
          </div>

          <div className="presets-belt">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Quick Presets:
            </span>
            {FEATURED_PRESETS.map((preset) => {
              const dotColor =
                preset.lang === 'Python' ? '#3572A5' : preset.lang === 'JavaScript' ? '#f1e05a' : '#3178c6'
              return (
                <button
                  key={preset.name}
                  type="button"
                  className="preset-pill"
                  onClick={() => applyPreset(preset)}
                >
                  <span className="preset-lang-dot" style={{ background: dotColor }} />
                  <span>{preset.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
                placeholder={profileUsername || 'e.g. octocat'}
                value={values.username}
                onChange={handleFieldChange('username')}
                onBlur={handleBlur('username')}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="bento-hint-text">
                {profileUsername ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={11} /> Auto-fetched from profile (@{profileUsername})
                  </span>
                ) : (
                  'Your GitHub profile handle'
                )}
              </span>
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
