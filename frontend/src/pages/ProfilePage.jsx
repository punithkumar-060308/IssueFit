import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Github,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { startGitHubConnect } from '../services/authApi'

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    github_username: '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        github_username: user.github?.username || user.github_username || '',
      })
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        github_username: user.github?.username || user.github_username || '',
      })
    }
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      await updateUserProfile(formData)
      setSuccessMsg('Your profile and GitHub username have been updated!')
      setTimeout(() => {
        setSuccessMsg('')
      }, 4000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return null
  }

  const currentGitHubUser = user.github?.username || user.github_username
  const isGitHubConnected = Boolean(user.github?.connected || currentGitHubUser)

  return (
    <div className="profile-page-root">
      <style>{`
        .profile-page-root {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-card {
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 28px;
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .profile-hero {
          display: flex;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
        }

        .profile-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--border-bright);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.25);
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .profile-hero-meta {
          flex: 1;
          min-width: 220px;
        }

        .profile-hero-name {
          font-size: 22px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .profile-hero-email {
          font-size: 14px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }

        .profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-pill.verified {
          background: var(--success-bg);
          border: 1px solid var(--success-glow);
          color: var(--success);
        }

        .badge-pill.github {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--primary);
        }

        .badge-pill.warning {
          background: var(--warning-bg);
          border: 1px solid var(--warning-glow);
          color: var(--warning);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .section-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .section-header p {
          font-size: 13px;
          color: var(--text-muted);
          margin: 2px 0 0 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .form-input {
          width: 100%;
          padding: 11px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          background: var(--surface-hover);
        }

        .form-input[readonly] {
          opacity: 0.7;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.15);
        }

        .form-hint {
          font-size: 12px;
          color: var(--text-subtle);
          margin-top: 2px;
        }

        .status-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
        }

        .status-banner.success {
          background: var(--success-bg);
          border: 1px solid var(--success-glow);
          color: var(--success);
        }

        .status-banner.error {
          background: var(--danger-bg);
          border: 1px solid var(--danger-glow);
          color: var(--danger);
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--surface-hover);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          color: var(--text);
          border-color: var(--border-bright);
        }

        .btn-primary-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: var(--primary-gradient);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-sm);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.2s ease;
        }

        .btn-primary-action:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .btn-primary-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .github-connect-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
        }

        .github-connect-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      `}</style>

      {/* Hero Header Card */}
      <section className="profile-card">
        <div className="profile-hero">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User'}
              className="profile-avatar-large"
            />
          ) : (
            <div className="profile-avatar-large">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-hero-meta">
            <h1 className="profile-hero-name">
              {user.name || 'Developer'}
            </h1>
            <div className="profile-hero-email">
              <Mail size={15} />
              <span>{user.email || 'No email attached'}</span>
            </div>
            <div className="profile-badges">
              <span className="badge-pill verified">
                <ShieldCheck size={13} />
                <span>Verified Account</span>
              </span>
              {currentGitHubUser ? (
                <span className="badge-pill github">
                  <Github size={13} />
                  <span>GitHub @{currentGitHubUser}</span>
                </span>
              ) : (
                <span className="badge-pill warning">
                  <span>GitHub Handle Not Set</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Status Banners */}
      {successMsg && (
        <div className="status-banner success" role="alert">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="status-banner error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="profile-card">
        <div className="section-header">
          <div>
            <h2>Account & GitHub Details</h2>
            <p>Your GitHub username is automatically used by IssueFit's AI radar to find recommendations for you.</p>
          </div>
        </div>

        <div className="form-grid">
          {/* GitHub Username (Key feature) */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-github">
              <Github size={15} />
              <span>GitHub Username</span>
            </label>
            <input
              id="user-github"
              type="text"
              className="form-input"
              value={formData.github_username}
              onChange={(e) => handleInputChange('github_username', e.target.value)}
              placeholder="e.g. octocat or your GitHub username"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="form-hint">
              This handle is automatically fetched when searching repositories so you never need to re-type it.
            </span>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-fullname">
              <User size={15} />
              <span>Display Name</span>
            </label>
            <input
              id="user-fullname"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Alex Morgan"
            />
          </div>

          {/* Email (Read-only) */}
          <div className="form-group">
            <label className="form-label" htmlFor="user-email">
              <Mail size={15} />
              <span>Email Address</span>
            </label>
            <input
              id="user-email"
              type="email"
              className="form-input"
              value={user.email || ''}
              readOnly
            />
            <span className="form-hint">Managed by your OAuth sign-in account</span>
          </div>
        </div>

        {/* GitHub OAuth Connection Box */}
        <div className="github-connect-box">
          <div className="github-connect-meta">
            <Github size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                GitHub OAuth Account
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {user.github?.username
                  ? `Authenticated as @${user.github.username}`
                  : 'Link with GitHub OAuth to enable direct star radar & repository sync.'}
              </div>
            </div>
          </div>

          {user.github?.username ? (
            <a
              href={user.github.profile_url || `https://github.com/${user.github.username}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              <span>View GitHub Profile</span>
              <ExternalLink size={14} />
            </a>
          ) : (
            <button
              type="button"
              className="btn-primary-action"
              onClick={startGitHubConnect}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              Connect GitHub
            </button>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            className="btn-primary-action"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
