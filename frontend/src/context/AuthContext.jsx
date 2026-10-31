import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getCurrentUser, logout, setStoredToken, updateProfile } from '../services/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [requiresGitHubConnection, setRequiresGitHubConnection] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = useCallback(async () => {
    // Intercept token from OAuth redirect query param if present
    try {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')
      if (token) {
        setStoredToken(token)
        params.delete('token')
        const newSearch = params.toString() ? `?${params.toString()}` : ''
        window.history.replaceState({}, '', `${window.location.pathname}${newSearch}`)
      }
    } catch {
      // Ignore URL parsing errors
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getCurrentUser()
      if (data && data.authenticated && data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
        setRequiresGitHubConnection(Boolean(data.requires_github_connection))
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setRequiresGitHubConnection(false)
      }
    } catch (err) {
      setUser(null)
      setIsAuthenticated(false)
      setRequiresGitHubConnection(false)
      setError(err?.message || 'Failed to authenticate')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logoutUser = useCallback(async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      setRequiresGitHubConnection(false)
      window.location.href = '/'
    }
  }, [])

  const updateUserProfile = useCallback(async (profileData) => {
    const res = await updateProfile(profileData)
    if (res && res.user) {
      setUser(res.user)
    }
    return res
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        requiresGitHubConnection,
        isLoading,
        error,
        checkAuth,
        logoutUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
