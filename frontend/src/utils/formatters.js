export function formatScore(score) {
  if (score === null || score === undefined) return 'N/A'
  const n = Number(score)
  return isNaN(n) ? 'N/A' : Math.round(n).toString()
}

export function formatDifficulty(difficulty) {
  if (!difficulty) return 'Not estimated'
  const valid = ['Easy', 'Medium', 'Hard']
  const normalized =
    String(difficulty).charAt(0).toUpperCase() +
    String(difficulty).slice(1).toLowerCase()
  return valid.includes(normalized) ? normalized : 'Not estimated'
}

export function isValidGitHubIssueUrl(url) {
  if (!url) return false
  try {
    const p = new URL(url)
    return (
      p.protocol === 'https:' &&
      p.hostname === 'github.com' &&
      /^\/[^/]+\/[^/]+\/issues\/\d+/.test(p.pathname)
    )
  } catch { return false }
}

export function parseGitHubRepoUrl(url) {
  if (!url) return null
  try {
    const p = new URL(url.trim())
    if (p.protocol !== 'https:' || p.hostname !== 'github.com') return null
    const parts = p.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    return { owner: parts[0], repo: parts[1] }
  } catch { return null }
}

export function difficultyColor(difficulty) {
  const d = formatDifficulty(difficulty)
  if (d === 'Easy') return 'var(--success)'
  if (d === 'Medium') return 'var(--warning)'
  if (d === 'Hard') return 'var(--danger)'
  return 'var(--muted)'
}

export function scoreColor(score) {
  const n = Number(score)
  if (isNaN(n)) return 'var(--muted)'
  if (n >= 80) return 'var(--success)'
  if (n >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

export function truncate(str, maxLen = 80) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str
}

