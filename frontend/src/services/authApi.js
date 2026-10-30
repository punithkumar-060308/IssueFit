const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Unable to retrieve the current user')
  }

  return response.json()
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Logout failed')
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

