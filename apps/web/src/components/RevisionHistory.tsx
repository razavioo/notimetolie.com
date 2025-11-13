'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Clock, User } from 'lucide-react'

interface Revision {
  id: string
  title: string
  content: string | null
  change_summary: string | null
  created_at: string
  created_by_id: string | null
}

interface RevisionHistoryProps {
  blockId: string
}

export function RevisionHistory({ blockId }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadRevisions()
    }
  }, [isOpen, blockId, hasLoaded])

  const loadRevisions = async () => {
    setIsLoading(true)
    try {
      const response = await api.getBlockRevisions(blockId)
      if (response.data) {
        setRevisions(response.data)
        setHasLoaded(true)
      }
    } catch (error) {
      console.error('Failed to load revisions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="h-4 w-4" />
        View History {hasLoaded && `(${revisions.length})`}
      </button>
    )
  }

  return (
    <div className="border-t border-border dark:border-gray-700 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">Revision History</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Hide
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
          <p>Loading revisions...</p>
        </div>
      ) : revisions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
          <p>No revision history yet</p>
          <p className="text-sm mt-1">Changes will appear here when the block is edited</p>
        </div>
      ) : (
        <div className="space-y-4">
          {revisions.map((revision, index) => (
            <div
              key={revision.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedRevision?.id === revision.id
                  ? 'border-primary bg-primary/10 dark:bg-primary/20 dark:border-primary/60'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => setSelectedRevision(selectedRevision?.id === revision.id ? null : revision)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <span className="font-medium text-foreground dark:text-gray-200">{formatDate(revision.created_at)}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/90 text-xs rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                {revision.created_by_id && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span>Editor</span>
                  </div>
                )}
              </div>

              <div className="text-sm">
                <div className="font-medium mb-1 text-foreground dark:text-gray-100">{revision.title}</div>
                {revision.change_summary && (
                  <div className="text-muted-foreground dark:text-gray-400">
                    {revision.change_summary}
                  </div>
                )}
              </div>

              {selectedRevision?.id === revision.id && revision.content && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium mb-2 text-foreground dark:text-gray-200">Content Preview:</div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded p-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 font-mono">{revision.content.substring(0, 500)}{revision.content.length > 500 ? '...' : ''}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
