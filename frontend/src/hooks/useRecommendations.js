import { useState, useCallback } from 'react'
import { getRecommendations } from '../services/issuefitApi'

export function useRecommendations() {
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [lastSearch, setLastSearch] = useState(null)

  const search = useCallback(async (formValues) => {
    const { username, owner, repo } = formValues
    if (!username.trim() || !owner.trim() || !repo.trim()) {
      setError('All fields are required.')
      return
    }
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setLastSearch(formValues)

    try {
      const data = await getRecommendations({
        username: username.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
      })
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
      setRecommendations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setRecommendations([])
    setError(null)
    setHasSearched(false)
    setLastSearch(null)
  }, [])

  return { isLoading, recommendations, error, hasSearched, lastSearch, search, reset }
}

