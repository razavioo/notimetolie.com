'use client'

import { useState, useEffect } from 'react'
import { BlockPublic } from '@/types/api'

import { useRouter } from 'next/navigation'

interface BlockCardProps {
  block: BlockPublic
  onView?: (block: BlockPublic) => void
  onEdit?: (block: BlockPublic) => void
  onDelete?: (blockId: string) => void
}

export function BlockCard({ block, onView, onEdit, onDelete }: BlockCardProps) {
  const [showActions, setShowActions] = useState(false)
  const router = useRouter()

  const handleViewBlock = () => {
    if (onView) {
      onView(block)
    } else {
      router.push(`/blocks/${block.slug}`)
    }
    setShowActions(false)
  }

  const handleEditBlock = () => {
    if (onEdit) {
      onEdit(block)
    }
    setShowActions(false)
  }

  const handleDeleteBlock = () => {
    if (onDelete) {
      onDelete(block.id)
    }
    setShowActions(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBlockTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      image: 'bg-green-100 text-green-800',
      video: 'bg-purple-100 text-purple-800',
      code: 'bg-yellow-100 text-yellow-800',
      link: 'bg-indigo-100 text-indigo-800',
      embedded: 'bg-pink-100 text-pink-800',
      callout: 'bg-red-100 text-red-800',
      table: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{block.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`px-2 py-1 rounded-full text-xs ${getBlockTypeColor(block.block_type)}`}>
              {block.block_type}
            </span>
            <span>•</span>
            <span>{formatDate(block.created_at)}</span>
            {block.is_locked && (
              <>
                <span>•</span>
                <span className="text-orange-600">🔒 Locked</span>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ⋮
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10 min-w-[120px]">
              {onView && (
                <button
                  onClick={handleViewBlock}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  View
                </button>
              )}
              {onEdit && (
                <button
                  onClick={handleEditBlock}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteBlock}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        <code className="bg-gray-100 px-1 rounded">/{block.slug}</code>
      </div>

      {block.content && (
        <div className="text-sm text-gray-600 line-clamp-3">
          {block.content.substring(0, 150)}
          {block.content.length > 150 && '...'}
        </div>
      )}
    </div>
  )
}