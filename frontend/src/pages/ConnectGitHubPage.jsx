import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { startGitHubConnect } from '../services/authApi'
import { Github, Shield, Sparkles, AlertCircle, LogOut, Loader2, ArrowRight } from 'lucide-react'

export default function ConnectGitHubPage() {
  const { user, logoutUser } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const errorInfo = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const msg = params.get('message')

    if (!err) return null

    switch (err) {
      case 'conflict':
        return msg || 'This GitHub account is already linked to another IssueFit user. Please connect a different GitHub account.'
      case 'cancelled':
        return 'GitHub account connection was cancelled. Please authorize GitHub to proceed to your dashboard.'
      case 'invalid_state':
        return 'The linking session expired. Please click Connect GitHub again.'
      case 'auth_failed':
        return 'Failed to verify the GitHub account. Please try again.'
      case 'github_not_configured':
        return 'GitHub OAuth is not configured on the server.'
      default:
        return msg || 'An error occurred during account linking. Please try again.'
    }
  }, [])

  const handleConnect = () => {
    setIsRedirecting(true)
    startGitHubConnect()
  }

  return (
    <>
      <style>{`
        .connect-page-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          background: var(--bg, #060813);
          color: var(--text, #f8fafc);
        }

        .connect-glow {
          position: absolute;
          top: 20%;
          left: 35%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .connect-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 480px;
          background: var(--surface-card, rgba(15, 23, 42, 0.7));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          border-radius: 20px;
          padding: 40px 34px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15);
          text-align: center;
        }

        .account-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          margin-bottom: 24px;
          font-size: 13px;
        }

        .user-avatar-tiny {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-email-text {
          color: var(--text-muted, #94a3b8);
          font-size: 12.5px;
        }

        .connect-icon-duo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .connect-circle-icon {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          background: rgba(255, 255, 255, 0.04);
        }

        .connect-circle-icon.gh {
          background: #24292e;
          color: #ffffff;
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.1);
        }

        .connect-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 10px;
          color: var(--text, #ffffff);
        }

        .connect-description {
          font-size: 14px;
          color: var(--text-muted, #94a3b8);
          line-height: 1.6;
          margin: 0 0 26px;
        }

        .connect-error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          text-align: left;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 12px 14px;
          color: #f87171;
          font-size: 13px;
          margin-bottom: 22px;
        }

        .connect-btn {
          width: 100%;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          background: var(--primary-gradient, linear-gradient(135deg, #6366f1 0%, #a855f7 100%));
          color: #ffffff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease;
        }

        .connect-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55);
        }

        .connect-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .reassurance-list {
          margin-top: 24px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
        }

        .reassurance-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: var(--text-muted, #94a3b8);
        }

        .switch-account-btn {
          margin-top: 22px;
          background: none;
          border: none;
          color: var(--text-muted, #94a3b8);
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .switch-account-btn:hover {
          color: var(--text, #ffffff);
        }
      `}</style>

      <div className="connect-page-wrapper">
        <div className="connect-glow" aria-hidden="true" />

        <div className="connect-card">
          {user && (
            <div className="account-badge-pill">
              {user.avatar_url && (
                <img src={user.avatar_url} alt={user.name || 'User'} className="user-avatar-tiny" />
              )}
              <span>{user.name}</span>
              <span className="user-email-text">({user.email})</span>
            </div>
          )}

          <div className="connect-icon-duo">
            <div className="connect-circle-icon gh">
              <Github size={28} />
            </div>
          </div>

          <h1 className="connect-title">Connect your GitHub account</h1>
          <p className="connect-description">
            IssueFit uses your GitHub profile and repositories to understand your programming languages, skills, and experience level, and recommend open-source issues you can conquer.
          </p>

          {errorInfo && (
            <div className="connect-error-box" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{errorInfo}</div>
            </div>
          )}

          <button
            type="button"
            className="connect-btn"
            onClick={handleConnect}
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <Loader2 size={18} className="auth-spin" />
                <span>Redirecting to GitHub...</span>
              </>
            ) : (
              <>
                <Github size={20} />
                <span>Connect GitHub</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="reassurance-list">
            <div className="reassurance-item">
              <Shield size={16} color="#10b981" />
              <span>Read-only public profile & repo access</span>
            </div>
            <div className="reassurance-item">
              <Sparkles size={16} color="#6366f1" />
              <span>Required to analyze contributor skills & match issues</span>
            </div>
          </div>

          <button
            type="button"
            className="switch-account-btn"
            onClick={logoutUser}
          >
            <LogOut size={14} />
            <span>Sign out / Switch account</span>
          </button>
        </div>
      </div>
    </>
  )
}

