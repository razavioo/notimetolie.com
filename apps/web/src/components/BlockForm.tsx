'use client'

import { useState } from 'react'
import { BlockEditor } from '@/components/BlockEditor'
import { Block } from '@blocknote/core'

interface BlockFormData {
  title: string
  slug: string
  block_type: string
  content?: Block[]
}

interface BlockFormProps {
  onSubmit: (data: BlockFormData) => Promise<void>
  initialData?: Partial<BlockFormData>
  isLoading?: boolean
}

export function BlockForm({ onSubmit, initialData, isLoading = false }: BlockFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [blockType, setBlockType] = useState(initialData?.block_type || 'text')
  const [content, setContent] = useState<Block[]>(initialData?.content || [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return

    await onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      block_type: blockType,
      content
    })
  }

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
            placeholder="Enter block title"
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

      <div>
        <label htmlFor="block_type" className="block text-sm font-medium mb-2">
          Block Type
        </label>
        <select
          id="block_type"
          value={blockType}
          onChange={(e) => setBlockType(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="code">Code</option>
          <option value="link">Link</option>
          <option value="embedded">Embedded</option>
          <option value="callout">Callout</option>
          <option value="table">Table</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Content
        </label>
        <BlockEditor
          initialContent={content}
          onChange={setContent}
          placeholder="Write your block content here..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !title.trim() || !slug.trim()}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : initialData ? 'Update Block' : 'Create Block'}
      </button>
    </form>
  )
}