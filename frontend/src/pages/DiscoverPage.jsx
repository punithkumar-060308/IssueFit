import { useState, useMemo, useEffect, useRef } from 'react'
import { GitBranch, Star, Code2, AlertCircle, LayoutGrid, ListFilter, SlidersHorizontal, Sparkles, Radio } from 'lucide-react'
import SearchForm from '../components/SearchForm'
import FilterPanel, { DEFAULT_FILTERS } from '../components/FilterPanel'
import IssueTable from '../components/IssueTable'
import IssueCard from '../components/IssueCard'
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

  if (filters.difficulty) {
    result = result.filter(
      (issue) =>
        (issue.difficulty || '').toLowerCase() === filters.difficulty.toLowerCase()
    )
  }

  if (filters.label) {
    result = result.filter((issue) =>
      issue.labels?.some((l) => l.toLowerCase() === filters.label.toLowerCase())
    )
  }

  if (filters.language) {
    result = result.filter((issue) =>
      issue.languages?.some((lang) => lang.toLowerCase() === filters.language.toLowerCase())
    )
  }

  if (filters.minScore > 0) {
    result = result.filter((issue) => Number(issue.final_score) >= filters.minScore)
  }

  if (filters.sort === 'recent') {
    result = result.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
  } else {
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
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
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

  const effectiveView = windowWidth < 960 ? 'grid' : viewMode

  return (
    <>
      <style>{`
        .discover-hero-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hero-title-unit {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hero-headline {
          font-size: 32px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.035em;
          line-height: 1.15;
        }

        .hero-subheadline {
          font-size: 14.5px;
          color: var(--text-muted);
        }

        .view-switcher-bar {
          display: flex;
          align-items: center;
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 3px;
          gap: 2px;
        }

        .view-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-xs);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .view-toggle-btn:hover {
          color: var(--text);
        }

        .view-toggle-btn.active {
          color: #ffffff;
          background: var(--primary);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }

        /* Connected Banner */
        .connected-hero-banner {
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          box-shadow: var(--shadow-glow);
        }

        .connected-info-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .connected-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .connected-desc {
          font-size: 12.5px;
          color: var(--text-muted);
          max-width: 650px;
        }

        .connected-stats-chips {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .results-bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
      `}</style>

      <div className="discover-hero-header">
        <div className="hero-title-unit">
          <h1 className="hero-headline">Issue Discovery Radar</h1>
          <p className="hero-subheadline">
            Explore curated issues analyzed and ranked against contributor skill profiles.
          </p>
        </div>

        {hasSearched && filteredIssues.length > 0 && (
          <div className="view-switcher-bar">
            <button
              type="button"
              className={`view-toggle-btn${effectiveView === 'table' ? ' active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-label="Table View"
            >
              <ListFilter size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn${effectiveView === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Bento Grid View"
            >
              <LayoutGrid size={14} />
              <span>Bento</span>
            </button>
          </div>
        )}
      </div>

      {connectedRepo?.metadata && (
        <div className="connected-hero-banner" role="status">
          <div className="connected-info-box">
            <div className="connected-title">
              <GitBranch size={17} style={{ color: 'var(--primary)' }} />
              <span>Connected: {connectedRepo.metadata.full_name || `${connectedRepo.owner}/${connectedRepo.repo}`}</span>
            </div>
            {connectedRepo.metadata.description && (
              <p className="connected-desc">{connectedRepo.metadata.description}</p>
            )}
          </div>

          <div className="connected-stats-chips">
            {connectedRepo.metadata.language && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Code2 size={13} style={{ color: 'var(--accent-cyan)' }} />
                <strong>{connectedRepo.metadata.language}</strong>
              </span>
            )}
            {connectedRepo.metadata.stargazers_count !== undefined && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Star size={13} style={{ color: 'var(--warning)' }} />
                <span>{connectedRepo.metadata.stargazers_count.toLocaleString()} stars</span>
              </span>
            )}
            {connectedRepo.metadata.open_issues_count !== undefined && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Radio size={13} style={{ color: 'var(--success)' }} />
                <span>{connectedRepo.metadata.open_issues_count} open issues</span>
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

      {isLoading && (
        <LoadingState message="Analyzing repository issues & generating suitabilities..." />
      )}

      {hasSearched && !isLoading && !error && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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

              {effectiveView === 'table' ? (
                <IssueTable recommendations={filteredIssues} />
              ) : (
                <div className="results-bento-grid">
                  {filteredIssues.map((issue, idx) => (
                    <IssueCard key={issue.number || idx} issue={issue} />
                  ))}
                </div>
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
                  ? 'Try relaxing your filter parameters to view more recommendations.'
                  : 'No suitable issues found for this search. Try another repository or contributor profile.'
              }
            />
          )}
        </div>
      )}
    </>
  )
}
