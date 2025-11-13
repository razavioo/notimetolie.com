'use client'

import { useState, useEffect } from 'react'
import { BlockCard } from '@/components/BlockCard'
import { BlockForm } from '@/components/BlockForm'
import { BlockPublic, BlockCreate } from '@/types/api'
import { api } from '@/lib/api'
import { Block } from '@blocknote/core'
import { useToast } from '@/components/ToastProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function BlocksPage() {
  const { hasPermission } = useAuth()
  const [blocks, setBlocks] = useState<BlockPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlockPublic | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getBlocks()
      if (response.data) {
        setBlocks(response.data)
      } else if (response.error) {
        // Handle specific error cases
        if (response.error.includes('404') || response.error.includes('not found')) {
          setBlocks([]) // Empty list is fine, show empty state
        } else {
          console.error('Failed to load blocks:', response.error)
          setError(response.error || 'Failed to load blocks')
          setBlocks([])
        }
      } else {
        setBlocks([])
      }
    } catch (error) {
      console.error('Failed to load blocks:', error)
      // Don't show error for empty data - just show empty state
      setBlocks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBlock = async (data: { title: string; slug: string; block_type: string; content?: Block[]; language?: string; tags?: string[] }) => {
    try {
      setIsSubmitting(true)

      const blockData: BlockCreate = {
        title: data.title,
        slug: data.slug,
        block_type: data.block_type as any,
        content: data.content ? JSON.stringify(data.content) : undefined,
        metadata: {
          blocknote_content: data.content
        },
        language: data.language,
        tags: data.tags
      }

      const newBlockResponse = await api.createBlock(blockData)
      if (newBlockResponse.data) {
        setBlocks(prev => [newBlockResponse.data!, ...prev])
      } else {
        throw new Error(newBlockResponse.error || 'Failed to create block')
      }
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create block:', error)
      alert('Failed to create block. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditBlock = async (data: { title: string; slug: string; block_type: string; content?: Block[]; language?: string; tags?: string[] }) => {
    if (!editingBlock) return

    try {
      setIsSubmitting(true)

      const updateData = {
        title: data.title,
        content: data.content ? JSON.stringify(data.content) : undefined,
        metadata: {
          blocknote_content: data.content,
          language: data.language,
          tags: data.tags
        }
      }

      const updatedBlockResponse = await api.updateBlock(editingBlock.id, updateData)
      if (updatedBlockResponse.data) {
        setBlocks(prev => prev.map(b => b.id === updatedBlockResponse.data!.id ? updatedBlockResponse.data! : b))
      } else {
        throw new Error(updatedBlockResponse.error || 'Failed to update block')
      }
      setEditingBlock(null)
    } catch (error) {
      console.error('Failed to update block:', error)
      alert('Failed to update block. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return

    try {
      await api.deleteBlock(blockId)
      setBlocks(prev => prev.filter(b => b.id !== blockId))
      // Success toast would be shown by the API layer
    } catch (error) {
      console.error('Failed to delete block:', error)
      // Error handled by toast in the API layer
    }
  }

  const handleViewBlock = (block: BlockPublic) => {
    // Navigate to block detail
    window.location.href = `/blocks/${block.slug}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Blocks</h1>
          <p className="text-muted-foreground">Create, edit, and manage your knowledge blocks</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('create_blocks') && (
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Block
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardContent>
        </Card>
      )}

      {(showForm || editingBlock) && (
        <div className="mb-8 p-6 border rounded-lg bg-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingBlock ? 'Edit Block' : 'Create New Block'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingBlock(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <BlockForm
            onSubmit={editingBlock ? handleEditBlock : handleCreateBlock}
            initialData={editingBlock ? {
              title: editingBlock.title,
              slug: editingBlock.slug,
              block_type: editingBlock.block_type,
              content: editingBlock.metadata?.blocknote_content,
              language: editingBlock.language,
              tags: editingBlock.tags
            } : undefined}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {blocks.length === 0 && !isLoading ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Start Building Your Knowledge Base</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Create your first knowledge block to get started. Blocks are the foundation of your knowledge infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create Your First Block
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onView={handleViewBlock}
              onEdit={setEditingBlock}
              onDelete={handleDeleteBlock}
            />
          ))}
        </div>
      )}
    </div>
  )
}
