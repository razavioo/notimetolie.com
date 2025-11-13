'use client'

import { useState, useEffect } from 'react'
import { SuggestionCreate, SuggestionResponse } from '@/types/api'
import { api } from '@/lib/api'

interface SuggestionsListProps {
  blockId: string
}

export function SuggestionsList({ blockId }: SuggestionsListProps) {
  const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadSuggestions()
  }, [blockId])

  const loadSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await api.getSuggestions(blockId)
      if (response.data) {
        setSuggestions(response.data)
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuggestion = async (data: SuggestionCreate) => {
    try {
      setIsSubmitting(true)
      const response = await api.createSuggestion(blockId, data)
      if (response.error) {
        console.error('Failed to create suggestion:', response.error)
        alert(`Failed to create suggestion: ${response.error}`)
      } else if (response.data) {
        setSuggestions(prev => [response.data!, ...prev])
        setShowForm(false)
        alert('✅ Suggestion created successfully! It will be reviewed by moderators.')
      }
    } catch (error) {
      console.error('Failed to create suggestion:', error)
      alert('Failed to create suggestion. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Expose a manual refresh control
  const handleRefresh = () => {
    loadSuggestions()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      implemented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading suggestions...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Suggestions ({suggestions.length})</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="border border-border bg-background text-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent transition-colors"
            title="Refresh"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add Suggestion
          </button>
        </div>
      </div>

      {showForm && (
        <SuggestionForm
          onSubmit={handleCreateSuggestion}
          isLoading={isSubmitting}
          onCancel={() => setShowForm(false)}
        />
      )}

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <p>No suggestions yet. Be the first to suggest an improvement!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-foreground">{suggestion.title}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                  {suggestion.status}
                </span>
              </div>

              {suggestion.content && (
                <p className="text-sm text-muted-foreground mb-2">{suggestion.content}</p>
              )}

              <p className="text-sm font-medium text-foreground mb-2">
                <span className="text-muted-foreground">Change Summary:</span> {suggestion.change_summary}
              </p>

              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Created {formatDate(suggestion.created_at)}</span>
                {suggestion.updated_at !== suggestion.created_at && (
                  <span>Updated {formatDate(suggestion.updated_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface SuggestionFormProps {
  onSubmit: (data: SuggestionCreate) => Promise<void>
  isLoading?: boolean
  onCancel: () => void
}

function SuggestionForm({ onSubmit, isLoading = false, onCancel }: SuggestionFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [changeSummary, setChangeSummary] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !changeSummary.trim()) return

    await onSubmit({
      title: title.trim(),
      content: content.trim() || undefined,
      change_summary: changeSummary.trim()
    })
  }

  return (
    <div className="border border-border rounded-lg p-4 mb-4 bg-accent/50 dark:bg-accent">
      <h4 className="font-medium mb-3 text-foreground">Create New Suggestion</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1 text-foreground">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of your suggestion"
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1 text-foreground">
            Content (Optional)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Detailed explanation of your suggestion..."
            rows={3}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground resize-none"
          />
        </div>

        <div>
          <label htmlFor="changeSummary" className="block text-sm font-medium mb-1 text-foreground">
            Change Summary *
          </label>
          <textarea
            id="changeSummary"
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Summarize the changes you're suggesting..."
            rows={2}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm placeholder:text-muted-foreground resize-none"
            required
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading || !title.trim() || !changeSummary.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Suggestion'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="border border-border bg-background text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
