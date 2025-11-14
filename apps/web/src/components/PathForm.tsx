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
  const [language, setLanguage] = useState(initialData?.language || 'en')
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Update form fields when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setSlug(initialData.slug || '')
      setSelectedBlocks(initialData.block_ids || [])
      setLanguage(initialData.language || 'en')
      setTagsInput(initialData.tags?.join(', ') || '')
    } else {
      // Reset form for create mode
      setTitle('')
      setSlug('')
      setSelectedBlocks([])
      setLanguage('en')
      setTagsInput('')
    }
    setValidationError(null)
  }, [initialData])

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
    const block = availableBlocks.find(b => b.id === blockId)
    if (!block) return

    // Check language consistency
    if (selectedBlocks.length > 0) {
      const firstSelectedBlock = availableBlocks.find(b => b.id === selectedBlocks[0])
      if (firstSelectedBlock?.language && block.language && firstSelectedBlock.language !== block.language) {
        setValidationError(`All blocks in a path must be in the same language. First block is in ${firstSelectedBlock.language}, but this block is in ${block.language}`)
        return
      }
    }

    setValidationError(null)
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

    // Validate all blocks have same language
    if (selectedBlocks.length > 1) {
      const languages = new Set(
        selectedBlocks
          .map(id => availableBlocks.find(b => b.id === id)?.language)
          .filter(Boolean)
      )
      if (languages.size > 1) {
        setValidationError('All blocks in a path must be in the same language')
        return
      }
    }

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    await onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      block_ids: selectedBlocks,
      language,
      tags: tags.length > 0 ? tags : undefined
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
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-2">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="ar">Arabic</option>
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., tutorial, beginner, python"
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
          {validationError}
        </div>
      )}

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
                      <div className="text-xs text-muted-foreground">
                        {block.block_type}
                        {block.language && ` • ${block.language}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddBlock(block.id)}
                      disabled={selectedBlocks.includes(block.id)}
                      className="text-xs border px-2 py-1 rounded disabled:opacity-50 hover:bg-accent"
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
                        <div className="text-xs text-muted-foreground">
                          {b?.block_type || 'block'}
                          {b?.language && ` • ${b.language}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveBlock(id, 'up')} className="border px-2 py-1 rounded text-xs hover:bg-accent">↑</button>
                        <button type="button" onClick={() => moveBlock(id, 'down')} className="border px-2 py-1 rounded text-xs hover:bg-accent">↓</button>
                        <button type="button" onClick={() => handleRemoveBlock(id)} className="border px-2 py-1 rounded text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Remove</button>
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
