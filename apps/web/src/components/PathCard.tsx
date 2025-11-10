'use client'

import { useState } from 'react'
import { PathPublic } from '@/types/api'

interface PathCardProps {
  path: PathPublic
  onView?: (path: PathPublic) => void
  onEdit?: (path: PathPublic) => void
  onDelete?: (pathId: string) => void
}

export function PathCard({ path, onView, onEdit, onDelete }: PathCardProps) {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{path.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{path.blocks.length} blocks</span>
            <span>•</span>
            <span>{formatDate(path.created_at)}</span>
            {path.is_published && (
              <>
                <span>•</span>
                <span className="text-green-600">✓ Published</span>
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
                  onClick={() => { onView(path); setShowActions(false); }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  View
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => { onEdit(path); setShowActions(false); }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(path.id); setShowActions(false); }}
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
        <code className="bg-gray-100 px-1 rounded">/{path.slug}</code>
      </div>

      {path.blocks.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Blocks in path:</p>
          <div className="space-y-1">
            {path.blocks.slice(0, 3).map((block, index) => (
              <div key={block.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{index + 1}.</span>
                <span className="text-xs">{block.title}</span>
                <span className="text-xs text-gray-400">({block.block_type})</span>
              </div>
            ))}
            {path.blocks.length > 3 && (
              <div className="text-xs text-gray-400">
                +{path.blocks.length - 3} more blocks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}