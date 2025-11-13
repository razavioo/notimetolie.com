'use client'

import { SearchHit } from '@/types/api'

interface SearchResultsProps {
  results: SearchHit[]
  query: string
  onResultClick?: (result: SearchHit) => void
}

export function SearchResults({ results, query, onResultClick }: SearchResultsProps) {
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  const getResultIcon = (level: string) => {
    switch (level) {
      case 'block':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'path':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
    }
  }

  const formatLevel = (level: string) => {
    switch (level) {
      case 'block':
        return 'Block'
      case 'path':
        return 'Learning Path'
      default:
        return level.charAt(0).toUpperCase() + level.slice(1)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'block':
        return 'bg-blue-100 text-blue-800'
      case 'path':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>
      
      {results.map((result) => (
        <div
          key={result.id}
          onClick={() => onResultClick?.(result)}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-background"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(result.level)}`}>
                  {getResultIcon(result.level)}
                  {formatLevel(result.level)}
                </span>
                <span className="text-xs text-muted-foreground">/{result.slug}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.title, query) }} />
              </h3>
              
              {result.snippet && (
                <div className="text-sm text-muted-foreground line-clamp-2">
                  <span dangerouslySetInnerHTML={{ __html: highlightMatch(result.snippet, query) }} />
                </div>
              )}
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}