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

          <div className="border-t pt-6 space-y-2">
            <h3 className="text-lg font-semibold">Blocks in this path</h3>
            {path.blocks.length === 0 ? (
              <p className="text-muted-foreground">No blocks in this path yet.</p>
            ) : (
              <ol className="space-y-2 list-decimal pl-5">
                {path.blocks.map((block) => (
                  <li key={block.id} className="text-sm">
                    <span className="font-medium">{block.title}</span>
                    <span className="text-muted-foreground ml-2">({block.block_type})</span>
                  </li>
                ))}
              </ol>
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

