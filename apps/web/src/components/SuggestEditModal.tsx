'use client'

import { useEffect, useState } from 'react'
import { Block } from '@blocknote/core'
import { BlockEditor } from '@/components/BlockEditor'

interface SuggestEditModalProps {
  isOpen: boolean
  initialTitle: string
  initialContent?: Block[]
  onClose: () => void
  onSubmit: (args: { title: string; content?: Block[]; changeSummary: string }) => Promise<void>
  isSubmitting?: boolean
}

export function SuggestEditModal({
  isOpen,
  initialTitle,
  initialContent = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}: SuggestEditModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState<Block[]>(initialContent)
  const [changeSummary, setChangeSummary] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle)
      setContent(initialContent)
      setChangeSummary('')
    }
  }, [isOpen, initialTitle, initialContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !changeSummary.trim()) return
    await onSubmit({ title: title.trim(), content, changeSummary: changeSummary.trim() })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 bg-white w-full max-w-3xl rounded-lg shadow-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">Suggest an Edit</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief description of your change"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Proposed Content</label>
            <BlockEditor initialContent={content} onChange={setContent} placeholder="Propose changes here..." />
            <p className="text-xs text-muted-foreground mt-1">Editing here does not change the live block until approved.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Change Summary *</label>
            <textarea
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Summarize your changes and why they're needed"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded-md hover:bg-gray-50">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !changeSummary.trim()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

