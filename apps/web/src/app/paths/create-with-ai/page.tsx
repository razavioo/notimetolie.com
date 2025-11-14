'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, GripVertical, X } from 'lucide-react'
import { AIAssistant } from '@/components/AIAssistant'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { api } from '@/lib/api'
import { AIBlockSuggestion, BlockPublic } from '@/types/api'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface PathSuggestion {
  title: string
  slug: string
  description?: string
  suggestedBlocks: AIBlockSuggestion[]
}

export default function CreatePathWithAIPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [pathSuggestion, setPathSuggestion] = useState<PathSuggestion | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [selectedBlocks, setSelectedBlocks] = useState<AIBlockSuggestion[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuggestionAccepted = (suggestion: any) => {
    // Parse AI suggestion to extract path structure and blocks
    const parsedSuggestion: PathSuggestion = {
      title: suggestion.title || 'Untitled Path',
      slug: suggestion.slug || generateSlug(suggestion.title || 'untitled-path'),
      description: suggestion.ai_rationale || '',
      suggestedBlocks: suggestion.suggested_blocks || []
    }
    
    setPathSuggestion(parsedSuggestion)
    setTitle(parsedSuggestion.title)
    setSlug(parsedSuggestion.slug)
    setDescription(parsedSuggestion.description || '')
    setSelectedBlocks(parsedSuggestion.suggestedBlocks)
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/--+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(selectedBlocks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedBlocks(items)
  }

  const removeBlock = (blockId: string) => {
    setSelectedBlocks(selectedBlocks.filter(b => b.id !== blockId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedBlocks.length === 0) {
      toast?.({
        title: 'Error',
        description: 'Please keep at least one block in the path',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // First, create all the suggested blocks
      const createdBlockIds: string[] = []
      
      for (const suggestion of selectedBlocks) {
        const blockData = {
          title: suggestion.title,
          slug: suggestion.slug,
          block_type: suggestion.block_type || 'text',
          content: suggestion.content,
          language: suggestion.language,
          tags: suggestion.tags,
        }
        
        const { data: block, error } = await api.createBlock(blockData)
        
        if (block) {
          createdBlockIds.push(block.id)
          // Approve the AI suggestion
          await api.approveAISuggestion(suggestion.id)
        } else {
          console.error('Failed to create block:', error)
        }
      }

      if (createdBlockIds.length === 0) {
        throw new Error('No blocks were created')
      }

      // Create the path with the created blocks
      const { data: path, error: pathError } = await api.createPath({
        title,
        slug,
        description,
        block_ids: createdBlockIds,
      })

      if (path) {
        toast?.({
          title: 'Success',
          description: 'Learning path created successfully with AI assistance!',
          variant: 'default'
        })
        router.push(`/paths/${path.slug}`)
      } else {
        throw new Error(pathError || 'Failed to create path')
      }
    } catch (error) {
      console.error('Failed to create path:', error)
      toast?.({
        title: 'Error',
        description: 'Failed to create path. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Create Learning Path with AI
          </div>
        }
        description="Use AI to generate a complete learning path with structured content blocks"
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="mt-8 max-w-6xl mx-auto">
        {!pathSuggestion ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="max-w-2xl w-full">
              <div className="bg-muted/50 p-6 rounded-lg border mb-6">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Describe the learning path you want to create</li>
                  <li>AI will suggest a path structure with multiple content blocks</li>
                  <li>Review, reorder, and customize the suggestions</li>
                  <li>Create the complete learning path with one click</li>
                </ol>
              </div>
              
              <AIAssistant
                onSuggestionAccepted={handleSuggestionAccepted}
                agentType="course_designer"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm mb-1">✨ AI Path Structure Generated</p>
                  <p className="text-sm text-muted-foreground">
                    Review the path details and block structure below. Reorder or remove blocks as needed.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPathSuggestion(null)
                    setSelectedBlocks([])
                  }}
                >
                  Try Another
                </Button>
              </div>
            </div>

            {/* Path Info */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Path Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setSlug(generateSlug(e.target.value))
                    }}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    placeholder="e.g., Complete Guide to React"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium mb-2">
                    Slug *
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    placeholder="complete-guide-to-react"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly identifier (auto-generated)
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Brief description of what this path covers..."
                  />
                </div>
              </div>
            </div>

            {/* Block Structure */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Path Structure ({selectedBlocks.length} blocks)
              </h2>
              
              {selectedBlocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">All blocks removed</p>
                  <p className="text-sm">Add at least one block to create the path</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="selectedBlocks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {selectedBlocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 border border-border rounded-md bg-background ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing pt-1">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="font-medium">{block.title}</div>
                                        <div className="text-sm text-muted-foreground mt-1">{block.slug}</div>
                                        {block.ai_rationale && (
                                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                                            <span className="font-medium">AI Rationale:</span> {block.ai_rationale}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeBlock(block.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                    {block.content && (
                                      <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                        {block.content.substring(0, 150)}...
                                      </div>
                                    )}
                                    {block.tags && block.tags.length > 0 && (
                                      <div className="flex gap-1 mt-2 flex-wrap">
                                        {block.tags.map((tag, i) => (
                                          <span key={i} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/paths')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedBlocks.length === 0}
              >
                {isSubmitting ? 'Creating Path...' : 'Create Learning Path'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
