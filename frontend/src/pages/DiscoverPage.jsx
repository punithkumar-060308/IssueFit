import { useState, useMemo, useEffect, useRef } from 'react'
import { GitBranch, Star, Code2, AlertCircle, ArrowUpRight } from 'lucide-react'
import SearchForm from '../components/SearchForm'
import FilterPanel, { DEFAULT_FILTERS } from '../components/FilterPanel'
import IssueTable from '../components/IssueTable'
import IssueList from '../components/IssueList'
import ResultsHeader from '../components/ResultsHeader'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import { useRecommendations } from '../hooks/useRecommendations'

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return width
}

function filterRecommendations(list, filters, searchQuery) {
  let result = [...list]

  // Global search filtering
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    result = result.filter(
      (issue) =>
        issue.title?.toLowerCase().includes(q) ||
        String(issue.number).includes(q) ||
        issue.repository?.toLowerCase().includes(q) ||
        issue.labels?.some((l) => l.toLowerCase().includes(q))
    )
  }

  // Difficulty filter
  if (filters.difficulty) {
    result = result.filter(
      (issue) =>
        (issue.difficulty || '').toLowerCase() === filters.difficulty.toLowerCase()
    )
  }

  // Label filter
  if (filters.label) {
    result = result.filter((issue) =>
      issue.labels?.some((l) => l.toLowerCase() === filters.label.toLowerCase())
    )
  }

  // Language filter
  if (filters.language) {
    result = result.filter((issue) =>
      issue.languages?.some((lang) => lang.toLowerCase() === filters.language.toLowerCase())
    )
  }

  // Min Score filter
  if (filters.minScore > 0) {
    result = result.filter((issue) => Number(issue.final_score) >= filters.minScore)
  }

  // Sort filter
  if (filters.sort === 'recent') {
    result = result.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
  } else {
    // Best match default
    result = result.sort((a, b) => Number(b.final_score || 0) - Number(a.final_score || 0))
  }

  return result
}

export default function DiscoverPage({ searchQuery, connectedRepo }) {
  const {
    isLoading,
    recommendations,
    error,
    hasSearched,
    lastSearch,
    search,
  } = useRecommendations()

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [prefill, setPrefill] = useState(null)
  const windowWidth = useWindowWidth()
  const prevConnectedRepo = useRef(null)

  useEffect(() => {
    if (connectedRepo) {
      const repoKey = `${connectedRepo.owner}/${connectedRepo.repo}`
      if (repoKey !== prevConnectedRepo.current) {
        prevConnectedRepo.current = repoKey
        setPrefill({ owner: connectedRepo.owner, repo: connectedRepo.repo })
      }
    }
  }, [connectedRepo])

  const availableLabels = useMemo(() => {
    const set = new Set()
    recommendations.forEach((item) => {
      item.labels?.forEach((lbl) => set.add(lbl))
    })
    return Array.from(set).sort()
  }, [recommendations])

  const availableLanguages = useMemo(() => {
    const set = new Set()
    recommendations.forEach((item) => {
      item.languages?.forEach((lang) => set.add(lang))
    })
    return Array.from(set).sort()
  }, [recommendations])

  const filteredIssues = useMemo(() => {
    return filterRecommendations(recommendations, filters, searchQuery)
  }, [recommendations, filters, searchQuery])

  const showTableView = windowWidth >= 960

  return (
    <>
      <style>{`
        .page-header-block {
          margin-bottom: 24px;
        }

        .page-main-heading {
          font-size: 28px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }

        .page-main-subtext {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.5;
        }

        .connected-repo-banner {
          background: var(--surface);
          border: 1px solid var(--primary-border);
          border-left: 4px solid var(--primary);
          border-radius: var(--radius-sm);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .connected-repo-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .connected-repo-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connected-repo-desc {
          font-size: 12px;
          color: var(--muted);
          max-width: 600px;
        }

        .connected-repo-metrics {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .connected-metric-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .results-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 12px;
          animation: fadeIn 0.25s ease;
        }
      `}</style>

      <div className="page-header-block">
        <h1 className="page-main-heading">Issues</h1>
        <p className="page-main-subtext">Search issues you are interested in...</p>
      </div>

      {connectedRepo?.metadata && (
        <div className="connected-repo-banner" role="status">
          <div className="connected-repo-details">
            <div className="connected-repo-title">
              <GitBranch size={16} style={{ color: 'var(--primary)' }} />
              <span>Connected: {connectedRepo.metadata.full_name || `${connectedRepo.owner}/${connectedRepo.repo}`}</span>
            </div>
            {connectedRepo.metadata.description && (
              <p className="connected-repo-desc">{connectedRepo.metadata.description}</p>
            )}
          </div>

          <div className="connected-repo-metrics">
            {connectedRepo.metadata.language && (
              <span className="connected-metric-item">
                <Code2 size={13} style={{ color: 'var(--warning)' }} />
                {connectedRepo.metadata.language}
              </span>
            )}
            {connectedRepo.metadata.stargazers_count !== undefined && (
              <span className="connected-metric-item">
                <Star size={13} style={{ color: 'var(--warning)' }} />
                {connectedRepo.metadata.stargazers_count.toLocaleString()} stars
              </span>
            )}
            {connectedRepo.metadata.open_issues_count !== undefined && (
              <span className="connected-metric-item">
                <AlertCircle size={13} style={{ color: 'var(--success)' }} />
                {connectedRepo.metadata.open_issues_count.toLocaleString()} open issues
              </span>
            )}
          </div>
        </div>
      )}

      <SearchForm
        onSubmit={search}
        isLoading={isLoading}
        prefill={prefill}
      />

      {error && (
        <ErrorMessage
          message={error}
          onRetry={lastSearch ? () => search(lastSearch) : undefined}
        />
      )}

      {isLoading && <LoadingState message="Analyzing repository & finding suitable issues..." />}

      {hasSearched && !isLoading && !error && (
        <div className="results-container">
          {recommendations.length > 0 && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableLabels={availableLabels}
              availableLanguages={availableLanguages}
            />
          )}

          {filteredIssues.length > 0 ? (
            <>
              <ResultsHeader
                count={filteredIssues.length}
                username={lastSearch?.username}
                repository={lastSearch ? `${lastSearch.owner}/${lastSearch.repo}` : ''}
              />
              {showTableView ? (
                <IssueTable recommendations={filteredIssues} />
              ) : (
                <IssueList recommendations={filteredIssues} />
              )}
            </>
          ) : (
            <EmptyState
              title={
                recommendations.length > 0
                  ? 'No issues match your current filters'
                  : 'No suitable issues found'
              }
              description={
                recommendations.length > 0
                  ? 'Try adjusting or clearing your active filters to see more recommendations.'
                  : 'No suitable issues found for this search. Try another repository or contributor profile.'
              }
            />
          )}
        </div>
      )}
    </>
  )
}
