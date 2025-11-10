'use client'

import { useEffect, useState } from 'react'
import { PathPublic, PathCreate } from '@/types/api'
import { BlockPublic } from '@/types/api'

interface PathFormProps {
  onSubmit: (data: PathCreate) => Promise<void>
  initialData?: Partial<PathCreate>
  isLoading?: boolean
}

export function PathForm({ onSubmit, initialData, isLoading = false }: PathFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>(initialData?.block_ids || [])
  const [availableBlocks, setAvailableBlocks] = useState<BlockPublic[]>([])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!initialData) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleAddBlock = (blockId: string) => {
    setSelectedBlocks(prev => (prev.includes(blockId) ? prev : [...prev, blockId]))
  }

  const handleRemoveBlock = (blockId: string) => {
    setSelectedBlocks(prev => prev.filter(id => id !== blockId))
  }

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setSelectedBlocks(prev => {
      const index = prev.indexOf(blockId)
      if (index === -1) return prev
      const newOrder = [...prev]
      const swapWith = direction === 'up' ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= newOrder.length) return prev
      const temp = newOrder[swapWith]
      newOrder[swapWith] = newOrder[index]
      newOrder[index] = temp
      return newOrder
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return

    await onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      block_ids: selectedBlocks
    })
  }

  useEffect(() => {
    // Load available blocks for selection
    let mounted = true
    import('@/lib/api').then(({ api }) => {
      api.getBlocks().then((res) => {
        if (mounted && res.data) setAvailableBlocks(res.data)
      }).catch(() => {})
    })

    return () => { mounted = false }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter path title"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
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
            onChange={(e) => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Available Blocks</label>
          <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
            {availableBlocks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No blocks available. Create blocks to compose a path.
              </p>
            ) : (
              <div className="space-y-2">
                {availableBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{block.title}</div>
                      <div className="text-xs text-muted-foreground">{block.block_type}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddBlock(block.id)}
                      disabled={selectedBlocks.includes(block.id)}
                      className="text-xs border px-2 py-1 rounded disabled:opacity-50"
                    >
                      {selectedBlocks.includes(block.id) ? 'Added' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Selected Blocks (ordered)</label>
          <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
            {selectedBlocks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No blocks selected yet.</p>
            ) : (
              <ol className="space-y-2 list-decimal pl-5">
                {selectedBlocks.map((id, idx) => {
                  const b = availableBlocks.find(x => x.id === id)
                  return (
                    <li key={id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm">{b?.title || id}</div>
                        <div className="text-xs text-muted-foreground">{b?.block_type || 'block'}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveBlock(id, 'up')} className="border px-2 py-1 rounded text-xs">↑</button>
                        <button type="button" onClick={() => moveBlock(id, 'down')} className="border px-2 py-1 rounded text-xs">↓</button>
                        <button type="button" onClick={() => handleRemoveBlock(id)} className="border px-2 py-1 rounded text-xs text-red-600">Remove</button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{selectedBlocks.length} block(s) selected</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !title.trim() || !slug.trim()}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : initialData ? 'Update Path' : 'Create Path'}
      </button>
    </form>
  )
}
