'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BlockEditor } from '@/components/BlockEditor'
import { SuggestionsList } from '@/components/SuggestionsList'
import { SuggestEditModal } from '@/components/SuggestEditModal'
import { BlockPublic, PathPublic } from '@/types/api'
import { api } from '@/lib/api'
import { Block } from '@blocknote/core'
import { SharePanel } from '@/components/SharePanel'
import { RevisionHistory } from '@/components/RevisionHistory'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'

export default function BlockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { hasPermission } = useAuth()
  const { toast } = useToast()

  const [block, setBlock] = useState<BlockPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const [suggestionsKey, setSuggestionsKey] = useState(0)
  const [editContent, setEditContent] = useState<Block[]>([])
  const [editTitle, setEditTitle] = useState('')
  const [pathsUsingBlock, setPathsUsingBlock] = useState<PathPublic[]>([])
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)
  const [isMastered, setIsMastered] = useState(false)
  const [masteredAt, setMasteredAt] = useState<string | null>(null)
  const [isMasteryLoading, setIsMasteryLoading] = useState(false)

  useEffect(() => {
    if (slug) {
      loadBlock()
      loadPathsUsingBlock()
    }
  }, [slug])

  useEffect(() => {
    // Auto-collapse content if mastered
    if (isMastered) {
      setIsContentCollapsed(true)
    }
  }, [isMastered])

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

        // Load mastery status
        await loadMasteryStatus(response.data.id)
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

  const loadMasteryStatus = async (blockId: string) => {
    try {
      const token = api.getToken()
      if (!token) return // User not logged in

      const response = await api.checkBlockProgress(blockId)
      if (response.data) {
        setIsMastered(response.data.mastered)
        setMasteredAt(response.data.mastered_at || null)
      }
    } catch (error) {
      console.error('Failed to load mastery status:', error)
    }
  }

  const toggleMastery = async () => {
    if (!block) return

    try {
      setIsMasteryLoading(true)
      if (isMastered) {
        // Unmark as mastered
        const response = await api.unmarkBlockMastered(block.id)
        if (response.data || !response.error) {
          setIsMastered(false)
          setMasteredAt(null)
          setIsContentCollapsed(false)
        }
      } else {
        // Mark as mastered
        const response = await api.markBlockMastered(block.id)
        if (response.data || !response.error) {
          setIsMastered(true)
          setMasteredAt(new Date().toISOString())
          setIsContentCollapsed(true)
        }
      }
    } catch (error) {
      console.error('Failed to toggle mastery:', error)
      toast({
        type: 'error',
        title: 'Failed to update mastery status',
        description: 'Please try again later.'
      })
    } finally {
      setIsMasteryLoading(false)
    }
  }

  const loadPathsUsingBlock = async () => {
    try {
      const pathsResponse = await api.getPaths()
      if (pathsResponse.data) {
        const response = await api.getBlock(slug)
        if (response.data) {
          const filteredPaths = pathsResponse.data.filter(path => 
            path.blocks?.some(b => b.id === response.data?.id)
          )
          setPathsUsingBlock(filteredPaths)
        }
      }
    } catch (error) {
      console.error('Failed to load paths:', error)
    }
  }

  const handleSave = async () => {
    if (!block || !editTitle.trim()) return

    try {
      setIsSubmitting(true)
      const updateData = {
        title: editTitle,
        content: editContent ? JSON.stringify(editContent) : undefined,
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
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blocks</span>
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
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{block.title}</h1>
                  {isMastered && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      ✓ Mastered
                    </span>
                  )}
                </div>
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
                  {isMastered && masteredAt && (
                    <span className="text-green-600">Mastered {formatDate(masteredAt)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleMastery}
                  disabled={isMasteryLoading}
                  className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                    isMastered
                      ? 'text-green-700 dark:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                      : 'text-muted-foreground hover:text-green-700 dark:hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isMasteryLoading ? (
                    'Loading...'
                  ) : isMastered ? (
                    <>✓ I Know This</>
                  ) : (
                    <>I Know This</>
                  )}
                </button>
                {hasPermission('create_blocks') && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    Edit Block
                  </button>
                )}
                {hasPermission('create_suggestions') && (
                  <button
                    onClick={() => setIsSuggestOpen(true)}
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    Suggest an Edit
                  </button>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setIsContentCollapsed(!isContentCollapsed)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isMastered ? 'text-green-600 hover:text-green-700' : 'hover:text-primary'
                  }`}
                >
                  {isContentCollapsed ? (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span>{isMastered ? 'Content hidden (already mastered)' : 'Show content'}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Hide content</span>
                    </>
                  )}
                </button>
              </div>
              
              {!isContentCollapsed && (
                <>
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
                </>
              )}
            </div>

            {pathsUsingBlock.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-2">
                  Used in Paths
                  {pathsUsingBlock.length > 4 && (
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      (showing 4 of {pathsUsingBlock.length})
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {pathsUsingBlock.slice(0, 4).map(path => (
                    <div
                      key={path.id}
                      onClick={() => router.push(`/paths/${path.slug}`)}
                      className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{path.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{path.blocks?.length || 0} blocks</span>
                            {path.is_published && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">✓ Published</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6">
              <SharePanel nodeType="block" nodeId={block.id} slug={block.slug} />
            </div>

            <RevisionHistory blockId={block.id} />

            <div className="border-t pt-6">
              {block && <SuggestionsList key={suggestionsKey} blockId={block.id} />}
            </div>
            {block && (
              <SuggestEditModal
                isOpen={isSuggestOpen}
                onClose={() => setIsSuggestOpen(false)}
                initialTitle={block.title}
                initialContent={block.metadata?.blocknote_content || (block.content ? [{ type: 'paragraph', content: block.content }] : [])}
                isSubmitting={isSubmitting}
                onSubmit={async ({ title, content, changeSummary }) => {
                  try {
                    setIsSubmitting(true)
                    await api.createSuggestion(block.id, {
                      title,
                      content: content ? JSON.stringify(content) : undefined,
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
