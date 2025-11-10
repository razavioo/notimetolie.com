'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BlockEditor } from '@/components/BlockEditor'
import { SuggestionsList } from '@/components/SuggestionsList'
import { SuggestEditModal } from '@/components/SuggestEditModal'
import { BlockPublic } from '@/types/api'
import { api } from '@/lib/api'
import { Block } from '@blocknote/core'
import { SharePanel } from '@/components/SharePanel'

export default function BlockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [block, setBlock] = useState<BlockPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const [suggestionsKey, setSuggestionsKey] = useState(0)
  const [editContent, setEditContent] = useState<Block[]>([])
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    if (slug) {
      loadBlock()
    }
  }, [slug])

  const loadBlock = async () => {
    try {
      setIsLoading(true)
      const response = await api.getBlock(slug)
      if (response.data) {
        setBlock(response.data)
        setEditTitle(response.data.title)

        // Parse content if it exists and is in JSON format
        if (response.data.content && response.data.metadata?.blocknote_content) {
          setEditContent(response.data.metadata.blocknote_content)
        }
      } else {
        router.push('/blocks')
      }
    } catch (error) {
      console.error('Failed to load block:', error)
      router.push('/blocks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!block || !editTitle.trim()) return

    try {
      setIsSubmitting(true)
      const updateData = {
        title: editTitle,
        content: editContent?.map(block => JSON.stringify(block)).join('\n'),
        metadata: {
          blocknote_content: editContent
        }
      }

      const response = await api.updateBlock(block.id, updateData)
      if (response.data) {
        setBlock(response.data)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update block:', error)
      alert('Failed to update block. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (block) {
      setEditTitle(block.title)
      if (block.content && block.metadata?.blocknote_content) {
        setEditContent(block.metadata.blocknote_content)
      } else {
        setEditContent([])
      }
    }
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading block...</div>
      </div>
    )
  }

  if (!block) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Block not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/blocks')}
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← Back to Blocks
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter block title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Content
              </label>
              <BlockEditor
                initialContent={editContent}
                onChange={setEditContent}
                placeholder="Write your block content here..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !editTitle.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{block.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    block.block_type === 'text' ? 'bg-blue-100 text-blue-800' :
                    block.block_type === 'code' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {block.block_type}
                  </span>
                  <span>Created {formatDate(block.created_at)}</span>
                  {block.updated_at !== block.created_at && (
                    <span>Updated {formatDate(block.updated_at)}</span>
                  )}
                  {block.is_locked && (
                    <span className="text-orange-600">🔒 Locked</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Edit Block
              </button>
              <button
                onClick={() => setIsSuggestOpen(true)}
                className="ml-2 border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary/10"
              >
                Suggest an Edit
              </button>
            </div>

            <div className="border-t pt-6">
              {block.content && block.metadata?.blocknote_content ? (
                <BlockEditor
                  initialContent={block.metadata.blocknote_content}
                  onChange={() => {}} // Read-only
                  editable={false}
                />
              ) : block.content ? (
                <div className="prose max-w-none">
                  <p>{block.content}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No content available.</p>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Share</h3>
              <SharePanel nodeType="block" nodeId={block.id} slug={block.slug} />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Suggestions</h3>
              {block && <SuggestionsList key={suggestionsKey} blockId={block.id} />}
            </div>
            {block && (
              <SuggestEditModal
                isOpen={isSuggestOpen}
                onClose={() => setIsSuggestOpen(false)}
                initialTitle={`Suggest edit: ${block.title}`}
                initialContent={block.metadata?.blocknote_content || []}
                isSubmitting={isSubmitting}
                onSubmit={async ({ title, content, changeSummary }) => {
                  try {
                    setIsSubmitting(true)
                    await api.createSuggestion(block.id, {
                      title,
                      content: content?.map(b => JSON.stringify(b)).join('\n') || undefined,
                      change_summary: changeSummary,
                    })
                    setIsSuggestOpen(false)
                    setSuggestionsKey((k) => k + 1)
                  } catch (e) {
                    console.error('Failed to submit suggestion', e)
                    alert('Failed to submit suggestion')
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
