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

          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Learning Path</h3>
              <span className="text-sm text-muted-foreground">
                {path.blocks.length} {path.blocks.length === 1 ? 'step' : 'steps'}
              </span>
            </div>
            
            {path.blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground text-lg">No blocks in this path yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Start building your learning journey!</p>
              </div>
            ) : (
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-[35px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/10"></div>
                
                <div className="space-y-6">
                  {path.blocks.map((block, index) => {
                    const isFirst = index === 0
                    const isLast = index === path.blocks.length - 1
                    
                    return (
                      <div
                        key={block.id}
                        onClick={() => router.push(`/blocks/${block.slug}`)}
                        className="relative group"
                      >
                        {/* Animated hover background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Content card */}
                        <div className="relative flex items-start gap-6 p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer">
                          {/* Step number with glow */}
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                              {index + 1}
                            </div>
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                          </div>
                          
                          {/* Block content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h4 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                                {block.title}
                              </h4>
                              <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                {block.block_type}
                              </span>
                            </div>
                            
                            {block.content && (
                              <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                                {typeof block.content === 'string' ? block.content.substring(0, 200) : ''}
                                {typeof block.content === 'string' && block.content.length > 200 && '...'}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-sm">
                              <code className="bg-muted px-2 py-1 rounded text-xs text-foreground/70 font-mono">
                                /{block.slug}
                              </code>
                              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                                Click to explore →
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Connector dot */}
                        {!isLast && (
                          <div className="absolute left-[35px] bottom-0 w-2 h-2 bg-primary/50 rounded-full transform translate-y-8"></div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Completion indicator */}
                <div className="mt-8 flex items-center justify-center">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-primary">
                      {path.blocks.length} blocks to master
                    </span>
                  </div>
                </div>
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

