'use client'

import { useState, useEffect } from 'react'
import { BlockCard } from '@/components/BlockCard'
import { BlockForm } from '@/components/BlockForm'
import { BlockPublic, BlockCreate } from '@/types/api'
import { api } from '@/lib/api'
import { Block } from '@blocknote/core'

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<BlockPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlockPublic | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    try {
      setIsLoading(true)
      // Note: This is a mock implementation since we don't have a list endpoint yet
      // In a real app, you'd have a GET /blocks endpoint
      const mockBlocks: BlockPublic[] = []
      setBlocks(mockBlocks)
    } catch (error) {
      console.error('Failed to load blocks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBlock = async (data: BlockCreate & { content?: Block[] }) => {
    try {
      setIsSubmitting(true)

      const blockData: BlockCreate = {
        title: data.title,
        slug: data.slug,
        block_type: data.block_type as any,
        content: data.content?.map(block => JSON.stringify(block)).join('\n'),
        metadata: {
          blocknote_content: data.content
        }
      }

      const newBlock = await api.createBlock(blockData)
      setBlocks(prev => [newBlock, ...prev])
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create block:', error)
      alert('Failed to create block. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditBlock = async (data: BlockCreate & { content?: Block[] }) => {
    if (!editingBlock) return

    try {
      setIsSubmitting(true)

      const updateData = {
        title: data.title,
        content: data.content?.map(block => JSON.stringify(block)).join('\n'),
        metadata: {
          blocknote_content: data.content
        }
      }

      const updatedBlock = await api.updateBlock(editingBlock.id, updateData)
      setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b))
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
    } catch (error) {
      console.error('Failed to delete block:', error)
      alert('Failed to delete block. Please try again.')
    }
  }

  const handleViewBlock = (block: BlockPublic) => {
    // In a real app, this would navigate to a block detail page
    alert(`Viewing block: ${block.title}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading blocks...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blocks</h1>
          <p className="text-muted-foreground">Manage your knowledge blocks</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Create Block
        </button>
      </div>

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
            } : undefined}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No blocks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first knowledge block to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Create Your First Block
          </button>
        </div>
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