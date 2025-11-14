'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { BlockPublic } from '@/types/api'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, X, Search } from 'lucide-react'

export default function CreatePathPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [availableBlocks, setAvailableBlocks] = useState<BlockPublic[]>([])
  const [selectedBlocks, setSelectedBlocks] = useState<BlockPublic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    setIsLoading(true)
    const response = await api.getBlocks()
    if (response.data) {
      setAvailableBlocks(response.data)
    }
    setIsLoading(false)
  }

  const filteredBlocks = availableBlocks.filter(block =>
    block.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedBlocks.find(sb => sb.id === block.id)
  )

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(selectedBlocks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedBlocks(items)
  }

  const addBlock = (block: BlockPublic) => {
    if (!selectedBlocks.find(b => b.id === block.id)) {
      setSelectedBlocks([...selectedBlocks, block])
    }
  }

  const removeBlock = (blockId: string) => {
    setSelectedBlocks(selectedBlocks.filter(b => b.id !== blockId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedBlocks.length === 0) {
      alert('Please select at least two blocks to create a learning path')
      return
    }

    if (selectedBlocks.length === 1) {
      alert('A learning path needs at least 2 blocks. Please add one more block to create a journey.')
      return
    }

    setIsSaving(true)
    
    try {
      const response = await api.createPath({
        title,
        slug,
        description,
        block_ids: selectedBlocks.map(b => b.id),
      })

      if (response.data) {
        router.push(`/paths/${response.data.slug}`)
      } else {
        alert(response.error || 'Failed to create path')
      }
    } catch (error) {
      alert('Failed to create path')
    } finally {
      setIsSaving(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')  // Allow hyphens
      .replace(/--+/g, '-')  // Replace multiple hyphens with single
      .replace(/(^-|-$)/g, '')  // Remove leading/trailing hyphens
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/paths')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <span>← Back to Learning Paths</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Learning Path</h1>
          <p className="text-muted-foreground">
            Organize blocks into a structured learning journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Block Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Blocks */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Available Blocks</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search blocks..."
                    className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading blocks...</p>
                ) : availableBlocks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-2">No blocks available</p>
                    <p className="text-xs text-muted-foreground">Create some blocks first to build paths</p>
                  </div>
                ) : filteredBlocks.length === 0 ? (
                  <div className="text-center py-8">
                    {searchQuery ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">No blocks match "{searchQuery}"</p>
                        <p className="text-xs text-muted-foreground">Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">All blocks added to path</p>
                        <p className="text-xs text-muted-foreground">Great! You've included all available blocks</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2 px-1">
                      {filteredBlocks.length} block{filteredBlocks.length !== 1 ? 's' : ''} found
                    </p>
                    {filteredBlocks.map(block => (
                      <div
                        key={block.id}
                        className="p-3 border border-border rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => addBlock(block)}
                      >
                        <div className="font-medium text-sm">{block.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{block.slug}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Selected Blocks (Drag & Drop) */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Path Structure ({selectedBlocks.length})
              </h2>
              
              {selectedBlocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-2">No blocks selected yet</p>
                  <p className="text-sm">Click on blocks from the left to add them</p>
                  <p className="text-xs mt-2 text-primary">Minimum 2 blocks required for a path</p>
                </div>
              ) : selectedBlocks.length === 1 ? (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Add at least 1 more block to create a learning path
                  </p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="selectedBlocks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 max-h-[500px] overflow-y-auto"
                      >
                        {selectedBlocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 border border-border rounded-md bg-background flex items-center gap-2 ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{block.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">{block.slug}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeBlock(block.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
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
          </div>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/paths')}
              className="px-6 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || selectedBlocks.length < 2}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Creating...' : selectedBlocks.length === 1 ? 'Add 1 More Block' : 'Create Path'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
