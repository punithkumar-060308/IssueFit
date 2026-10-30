const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function getRecommendations(payload) {
  const response = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok || data.success === false) {
    throw new Error(data?.error?.message || 'Could not fetch recommendations.')
  }

  return data
}

export async function validateRepository(url) {
  const response = await fetch(`${API_BASE_URL}/api/repository/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Server returned an invalid response.')
  }

  if (!response.ok || data.success === false) {
    throw new Error(data?.error?.message || 'Repository could not be found or accessed.')
  }

  return data
}

export async function getLeaderboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getTrending() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trending`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    if (!response.ok) return false
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
