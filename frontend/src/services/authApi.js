const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export function getStoredToken() {
  try {
    return localStorage.getItem('issuefit_token')
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem('issuefit_token', token)
    }
  } catch {
    // Ignore storage quota / incognito errors
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem('issuefit_token')
  } catch {
    // Ignore errors
  }
}

export async function getCurrentUser() {
  const token = getStoredToken()
  const headers = { Accept: 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve the current user')
  }

  return response.json()
}

export async function logout() {
  const token = getStoredToken()
  const headers = { Accept: 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers,
  })

  clearStoredToken()

  if (!response.ok) {
    throw new Error('Logout failed')
  }

  return response.json()
}

export async function updateProfile(profileData) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: JSON.stringify(profileData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to update profile')
  }

  return response.json()
}

export function startGoogleLogin() {
  window.location.assign(`${API_BASE_URL}/auth/google/login`)
}

export function startGitHubLogin() {
  window.location.assign(`${API_BASE_URL}/auth/github/login`)
}

export function startGitHubConnect() {
  window.location.assign(`${API_BASE_URL}/auth/github/connect`)
}
