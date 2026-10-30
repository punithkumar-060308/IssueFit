import { useMemo } from 'react'
import { GitMerge, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react'
import LoginButtons from '../components/auth/LoginButtons'

export default function LoginPage() {
  const errorInfo = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const msg = params.get('message')

    if (!err) return null

    switch (err) {
      case 'cancelled':
        return 'Sign-in was cancelled. Please select an option to continue.'
      case 'invalid_state':
        return 'The authentication session expired or was invalid. Please try signing in again.'
      case 'auth_failed':
        return 'Authentication with the provider failed. Please check your account and try again.'
      case 'google_not_configured':
        return 'Google OAuth is not configured on the backend. Please check server environment settings.'
      case 'github_not_configured':
        return 'GitHub OAuth is not configured on the backend. Please check server environment settings.'
      case 'session_required':
        return 'You need an active session before connecting a GitHub account.'
      default:
        return msg || 'An authentication error occurred. Please try again.'
    }
  }, [])

  return (
    <>
      <style>{`
        .login-page-wrapper {
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

        .login-glow-1 {
          position: absolute;
          top: 15%;
          left: 30%;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .login-glow-2 {
          position: absolute;
          bottom: 15%;
          right: 25%;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.14) 0%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: var(--surface-card, rgba(15, 23, 42, 0.7));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
          border-radius: 20px;
          padding: 40px 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15);
          text-align: center;
        }

        .login-brand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: #ffffff;
          margin-bottom: 20px;
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.5);
        }

        .login-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 8px;
          color: var(--text, #ffffff);
        }

        .login-subtitle {
          font-size: 14px;
          color: var(--text-muted, #94a3b8);
          line-height: 1.5;
          margin: 0 0 28px;
        }

        .login-error-box {
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

        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
          color: var(--text-muted, #64748b);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border, rgba(255, 255, 255, 0.1));
        }

        .login-footer-notes {
          margin-top: 28px;
          font-size: 12px;
          color: var(--text-muted, #64748b);
          line-height: 1.5;
        }

        .login-perks {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
          font-size: 12px;
          color: var(--text-muted, #94a3b8);
        }

        .perk-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>

      <div className="login-page-wrapper">
        <div className="login-glow-1" aria-hidden="true" />
        <div className="login-glow-2" aria-hidden="true" />

        <div className="login-card">
          <div className="login-brand-icon">
            <GitMerge size={30} />
          </div>

          <h1 className="login-title">Sign in to IssueFit</h1>
          <p className="login-subtitle">
            Match open-source issues to your unique GitHub skills and experience level.
          </p>

          {errorInfo && (
            <div className="login-error-box" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{errorInfo}</div>
            </div>
          )}

          <LoginButtons />

          <div className="login-perks">
            <div className="perk-item">
              <ShieldCheck size={14} color="#10b981" />
              <span>Read-only GitHub scopes</span>
            </div>
            <div className="perk-item">
              <Sparkles size={14} color="#6366f1" />
              <span>AI Suitability Scoring</span>
            </div>
          </div>

          <div className="login-footer-notes">
            By signing in, you agree to IssueFit’s Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </>
  )
}

