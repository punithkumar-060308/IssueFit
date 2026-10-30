import { useState, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'

const INITIAL = { username: '', owner: '', repo: '' }

export default function SearchForm({ onSubmit, isLoading, prefill }) {
  const [values, setValues] = useState(prefill || INITIAL)
  const [touched, setTouched] = useState({})
  const prevPrefill = useRef(JSON.stringify(prefill))

  // Sync prefill without infinite re-render
  const nextPrefill = JSON.stringify(prefill)
  if (nextPrefill !== prevPrefill.current && prefill) {
    prevPrefill.current = nextPrefill
    setValues((v) => ({ ...v, ...prefill }))
  }

  const errors = {
    username: touched.username && !values.username.trim() ? 'GitHub username is required.' : '',
    owner: touched.owner && !values.owner.trim() ? 'Repository owner is required.' : '',
    repo: touched.repo && !values.repo.trim() ? 'Repository name is required.' : '',
  }

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched({ username: true, owner: true, repo: true })
    if (!values.username.trim() || !values.owner.trim() || !values.repo.trim()) return
    onSubmit(values)
  }

  return (
    <>
      <style>{`
        .search-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          margin-bottom: 24px;
        }
        .sf-heading {
          font-size: 20px; font-weight: 800; color: var(--text);
          margin-bottom: 4px; letter-spacing: -0.3px;
        }
        .sf-sub {
          font-size: 14px; color: var(--muted); margin-bottom: 20px;
        }
        .form-row { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          color: var(--text);
          font-size: 14px;
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input::placeholder { color: var(--muted); opacity: 0.6; }
        .form-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-muted); }
        .form-input.has-error { border-color: var(--danger); }
        .field-error { font-size: 12px; color: var(--danger); margin-top: -2px; }
        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--primary); color: #fff; border: none;
          border-radius: var(--radius-sm); padding: 12px 24px;
          font-size: 14px; font-weight: 600; width: 100%;
          transition: background 0.15s, opacity 0.15s;
        }
        .submit-btn:hover:not(:disabled) { background: var(--primary-hover); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 540px) { .form-row-2 { grid-template-columns: 1fr; } }
      `}</style>
      <div className="search-form">
        <h2 className="sf-heading">Find Your Next Contribution</h2>
        <p className="sf-sub">Enter your GitHub details to discover suitable issues.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="sf-username">GitHub Username</label>
              <input
                id="sf-username"
                className={`form-input${errors.username ? ' has-error' : ''}`}
                type="text"
                placeholder="e.g. octocat"
                value={values.username}
                onChange={set('username')}
                onBlur={touch('username')}
                autoComplete="off"
                spellCheck={false}
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sf-owner">Repository Owner</label>
              <input
                id="sf-owner"
                className={`form-input${errors.owner ? ' has-error' : ''}`}
                type="text"
                placeholder="e.g. fastapi"
                value={values.owner}
                onChange={set('owner')}
                onBlur={touch('owner')}
                autoComplete="off"
                spellCheck={false}
              />
              {errors.owner && <span className="field-error">{errors.owner}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sf-repo">Repository Name</label>
              <input
                id="sf-repo"
                className={`form-input${errors.repo ? ' has-error' : ''}`}
                type="text"
                placeholder="e.g. fastapi"
                value={values.repo}
                onChange={set('repo')}
                onBlur={touch('repo')}
                autoComplete="off"
                spellCheck={false}
              />
              {errors.repo && <span className="field-error">{errors.repo}</span>}
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Finding issues…
              </>
            ) : (
              <>
                <Search size={16} />
                Find Suitable Issues
              </>
            )}
          </button>
        </form>
      </div>
    </>
  )
}

