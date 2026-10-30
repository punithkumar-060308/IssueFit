import { useEffect, useMemo, useState, useRef } from 'react'
import SearchForm from '../components/SearchForm'
import FilterPanel, { DEFAULT_FILTERS } from '../components/FilterPanel'
import IssueList from '../components/IssueList'
import IssueTable from '../components/IssueTable'
import ResultsHeader from '../components/ResultsHeader'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import { useRecommendations } from '../hooks/useRecommendations'

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

function applyFilters(list, filters, query) {
  let out = [...list]
  if (query?.trim()) {
    const q = query.trim().toLowerCase()
    out = out.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        String(i.number).includes(q) ||
        i.repository?.toLowerCase().includes(q) ||
        i.labels?.some((l) => l.toLowerCase().includes(q))
    )
  }
  if (filters.difficulty)
    out = out.filter((i) =>
      (i.difficulty || '').toLowerCase() === filters.difficulty.toLowerCase()
    )
  if (filters.label)
    out = out.filter((i) =>
      i.labels?.some((l) => l.toLowerCase() === filters.label.toLowerCase())
    )
  if (filters.minScore > 0)
    out = out.filter((i) => Number(i.final_score) >= filters.minScore)
  if (filters.sort === 'recent')
    out = out.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
  return out
}

export default function DiscoverPage({ searchQuery, connectedRepo }) {
  const { isLoading, recommendations, error, hasSearched, lastSearch, search } =
    useRecommendations()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [prefill, setPrefill] = useState(null)
  const width = useWindowWidth()
  const prevRepo = useRef(null)

  useEffect(() => {
    const key = connectedRepo ? `${connectedRepo.owner}/${connectedRepo.repo}` : null
    if (key && key !== prevRepo.current) {
      prevRepo.current = key
      setPrefill({ owner: connectedRepo.owner, repo: connectedRepo.repo })
    }
  }, [connectedRepo])

  const availableLabels = useMemo(() => {
    const s = new Set()
    recommendations.forEach((r) => r.labels?.forEach((l) => s.add(l)))
    return [...s]
  }, [recommendations])

  const filtered = useMemo(
    () => applyFilters(recommendations, filters, searchQuery),
    [recommendations, filters, searchQuery]
  )

  const useTable = width >= 900

  return (
    <>
      <style>{`
        .disc-heading {
          font-size: 26px; font-weight: 800; color: var(--text);
          margin-bottom: 4px; letter-spacing: -0.5px;
        }
        .disc-sub { font-size: 14px; color: var(--muted); margin-bottom: 22px; }
      `}</style>

      <h1 className="disc-heading">Issues</h1>
      <p className="disc-sub">Search issues you are interested in…</p>

      <SearchForm onSubmit={search} isLoading={isLoading} prefill={prefill} />

      {error && (
        <ErrorMessage
          message={error}
          onRetry={lastSearch ? () => search(lastSearch) : undefined}
        />
      )}

      {isLoading && <LoadingState />}

      {hasSearched && !isLoading && !error && (
        <>
          {recommendations.length > 0 && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableLabels={availableLabels}
            />
          )}
          {filtered.length > 0 ? (
            <>
              <ResultsHeader
                count={filtered.length}
                username={lastSearch?.username}
                repository={lastSearch ? `${lastSearch.owner}/${lastSearch.repo}` : ''}
              />
              {useTable ? (
                <IssueTable recommendations={filtered} />
              ) : (
                <IssueList recommendations={filtered} />
              )}
            </>
          ) : (
            <EmptyState
              title={recommendations.length > 0 ? 'No issues match your filters' : undefined}
              description={
                recommendations.length > 0
                  ? 'Try adjusting or resetting the filters.'
                  : undefined
              }
            />
          )}
        </>
      )}
    </>
  )
}

