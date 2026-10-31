const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

export async function getRecommendations(payload) {
  const token = localStorage.getItem('issuefit_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    credentials: 'include',
    headers,
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

export async function getIssueBreakdown(owner, repo, issueNumber) {
  const response = await fetch(`${API_BASE_URL}/api/issues/breakdown`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner,
      repo,
      issue_number: Number(issueNumber),
    }),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Server returned an invalid response.')
  }

  if (!response.ok || data.success === false) {
    const errorMsg = data?.error?.message || 'Could not generate issue breakdown.'
    const err = new Error(errorMsg)
    err.code = data?.error?.code
    err.status = response.status
    throw err
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
