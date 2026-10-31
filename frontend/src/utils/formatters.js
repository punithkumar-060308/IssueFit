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
    const raw = url.trim()
    const target = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
    const p = new URL(target)
    return (
      (p.hostname === 'github.com' || p.hostname === 'www.github.com') &&
      /^\/[^/]+\/[^/]+\/issues\/\d+/.test(p.pathname)
    )
  } catch {
    return false
  }
}

export function parseGitHubRepoUrl(url) {
  if (!url) return null
  try {
    let raw = url.trim()
    if (!raw) return null

    // Remove SSH prefix
    if (raw.startsWith('git@github.com:')) {
      raw = raw.replace('git@github.com:', '')
    }

    // Strip http://, https://, www.github.com, github.com
    raw = raw.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '')

    // Strip queries and hashes
    raw = raw.split('?')[0].split('#')[0].replace(/\/+$/, '')

    // Strip .git
    if (raw.endsWith('.git')) {
      raw = raw.slice(0, -4)
    }

    const parts = raw.split('/').filter(Boolean)
    if (parts.length < 2) return null

    const owner = parts[0]
    const repo = parts[1]

    if (!owner || !repo) return null
    return { owner, repo }
  } catch {
    return null
  }
}

export function parseIssueOwnerAndRepo(issue) {
  if (!issue) return null
  if (issue.repository && issue.repository.includes('/')) {
    const [owner, repo] = issue.repository.split('/')
    if (owner && repo) return { owner: owner.trim(), repo: repo.trim() }
  }
  if (issue.url) {
    const parsed = parseGitHubRepoUrl(issue.url)
    if (parsed) return parsed
  }
  return null
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
