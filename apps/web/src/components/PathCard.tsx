'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PathPublic } from '@/types/api'

interface PathCardProps {
  path: PathPublic
  onView?: (path: PathPublic) => void
  onEdit?: (path: PathPublic) => void
  onDelete?: (pathId: string) => void
}

export function PathCard({ path, onView, onEdit, onDelete }: PathCardProps) {
  const [showActions, setShowActions] = useState(false)
  const router = useRouter()

  const handleViewPath = () => {
    if (onView) {
      onView(path)
    } else {
      router.push(`/paths/${path.slug}`)
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

  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleViewPath}
    >
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
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            ⋮
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-background border rounded shadow-lg z-10 min-w-[120px]">
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewPath()
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  View
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(path)
                    setShowActions(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(path.id)
                    setShowActions(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-accent text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        <code className="bg-muted px-1 rounded text-foreground/80">/{path.slug}</code>
        {path.language && (
          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
            {path.language.toUpperCase()}
          </span>
        )}
      </div>

      {path.tags && path.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {path.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded">
              {tag}
            </span>
          ))}
          {path.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{path.tags.length - 3}</span>
          )}
        </div>
      )}

      {path.blocks.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-1">
            {(() => {
              const typeCounts = path.blocks.reduce((acc, block) => {
                acc[block.block_type] = (acc[block.block_type] || 0) + 1
                return acc
              }, {} as Record<string, number>)
              
              return Object.entries(typeCounts).map(([type, count]) => (
                <span key={type} className="text-xs px-2 py-0.5 bg-muted rounded">
                  {count}x {type}
                </span>
              ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}