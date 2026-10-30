import { useAuth } from '../../context/AuthContext'
import LoginPage from '../../pages/LoginPage'
import ConnectGitHubPage from '../../pages/ConnectGitHubPage'
import { GitMerge } from 'lucide-react'

export default function AuthGuard({ children }) {
  const { isAuthenticated, requiresGitHubConnection, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg, #060813)',
          color: 'var(--text-muted, #94a3b8)',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
            animation: 'pulse 1.8s infinite ease-in-out',
          }}
        >
          <GitMerge size={24} />
        </div>
        <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>
          Verifying IssueFit session...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return children
}

