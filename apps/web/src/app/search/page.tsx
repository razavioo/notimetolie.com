'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchInput } from '@/components/SearchInput'
import { SearchResults } from '@/components/SearchResults'
import { api } from '@/lib/api'
import { SearchResponse, SearchHit } from '@/types/api'
import { PageHeader } from '@/components/PageHeader'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [filters, setFilters] = useState({
    level: '',
    limit: 20,
    offset: 0
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchQuery = urlParams.get('q') || ''
    const levelFilter = urlParams.get('level') || ''
    
    if (searchQuery) {
      setQuery(searchQuery)
      if (levelFilter) {
        setFilters(prev => ({ ...prev, level: levelFilter }))
      }
      performSearch(searchQuery, levelFilter)
    }
  }, [])

  const performSearch = async (searchQuery: string, levelFilter: string = '') => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setError(null)
    setSearchPerformed(true)
    
    try {
      const response = await api.search(searchQuery, {
        limit: filters.limit,
        offset: filters.offset,
        level: levelFilter || undefined
      })
      
      if (response.data) {
        setResults(response.data.hits || [])
      } else {
        setResults([])
        setError(response.error || 'No results found')
      }
    } catch (err) {
      console.error('Search failed:', err)
      setError('Search service is currently unavailable')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setSearchPerformed(false)
    
    // Update URL with search parameters
    const params = new URLSearchParams()
    params.set('q', searchQuery)
    if (filters.level) params.set('level', filters.level)
    
    router.push(`/search?${params.toString()}`)
    performSearch(searchQuery, filters.level)
  }

  const handleFilterChange = (level: string) => {
    setFilters(prev => ({ ...prev, level }))
    if (query) {
      performSearch(query, level)
    }
  }

  const handleLoadMore = () => {
    setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))
    // In a real implementation, you'd append to existing results
    // For now, we'll just search again with new offset
    if (query) {
      performSearch(query, filters.level)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Search"
        description="Find blocks, paths, and content"
        icon={<Search className="h-8 w-8 text-primary" />}
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Search for blocks, paths, or content..."
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="level-filter" className="text-sm font-medium">
                Filter by:
              </label>
              <select
                id="level-filter"
                value={filters.level}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="block">Blocks</option>
                <option value="path">Paths</option>
              </select>
            </div>
          </div>
        </div>

        {error && !isLoading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {searchPerformed && !isLoading && results.length === 0 && query && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setQuery('')
                setFilters({ level: '', limit: 20, offset: 0 })
                router.push('/search')
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Clear Search
            </button>
          </div>
        )}

        {results.length > 0 && (
          <SearchResults
            results={results}
            query={query}
            onResultClick={(result) => {
              if (result.level === 'block') {
                router.push(`/blocks/${result.slug}`)
              } else if (result.level === 'path') {
                router.push(`/paths/${result.slug}`)
              }
            }}
          />
        )}

        {results.length > 0 && !isLoading && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
            >
              Load More Results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}