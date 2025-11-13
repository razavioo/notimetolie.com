'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { PathPublic } from '@/types/api'
import { SharePanel } from '@/components/SharePanel'

export default function PathDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [path, setPath] = useState<PathPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (slug) loadPath()
  }, [slug])

  const loadPath = async () => {
    try {
      setIsLoading(true)
      const response = await api.getPath(slug)
      if (response.data) setPath(response.data)
      else router.push('/paths')
    } catch (error) {
      console.error('Failed to load path:', error)
      router.push('/paths')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading path...</div>
      </div>
    )
  }

  if (!path) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Path not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/paths')}
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← Back to Paths
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{path.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{path.blocks.length} blocks</span>
                <span>•</span>
                <span>{new Date(path.created_at).toLocaleDateString()}</span>
                {path.is_published && (
                  <>
                    <span>•</span>
                    <span className="text-green-600">✓ Published</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Blocks in this path</h3>
            {path.blocks.length === 0 ? (
              <p className="text-muted-foreground">No blocks in this path yet.</p>
            ) : (
              <div className="space-y-3">
                {path.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    onClick={() => router.push(`/blocks/${block.slug}`)}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-card"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-1">{block.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-muted">
                            {block.block_type}
                          </span>
                          <code className="bg-muted px-1 rounded text-xs text-foreground/70">
                            /{block.slug}
                          </code>
                        </div>
                        {block.content && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {typeof block.content === 'string' ? block.content.substring(0, 150) : ''}
                            {typeof block.content === 'string' && block.content.length > 150 && '...'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Share</h3>
            <SharePanel nodeType="path" nodeId={path.id} slug={path.slug} />
          </div>
        </div>
      </div>
    </div>
  )
}

