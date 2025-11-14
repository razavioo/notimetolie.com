'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { PathPublic } from '@/types/api'
import { SharePanel } from '@/components/SharePanel'
import { useToast } from '@/components/ToastProvider'
import { ArrowLeft } from 'lucide-react'

export default function PathDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const slug = params.slug as string

  const [path, setPath] = useState<PathPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [masteredBlocks, setMasteredBlocks] = useState<Set<string>>(new Set())
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  useEffect(() => {
    if (slug) loadPath()
  }, [slug])

  useEffect(() => {
    if (path) loadUserProgress()
  }, [path])

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

  const loadUserProgress = async () => {
    try {
      const token = api.getToken()
      if (!token) return // User not logged in

      const response = await api.getUserProgress()
      if (response.data) {
        const masteredIds = new Set(response.data.map(p => p.content_node_id))
        setMasteredBlocks(masteredIds)
      }
    } catch (error) {
      console.error('Failed to load user progress:', error)
    }
  }

  const handleMarkAllMastered = async () => {
    if (!path) return

    try {
      setIsMarkingAll(true)
      const response = await api.markPathMastered(path.id)
      if (response.data || !response.error) {
        // Reload progress to update UI
        await loadUserProgress()
        // Also reload path data to ensure mastered field is updated
        await loadPath()
        toast({
          type: 'success',
          title: 'Path Completed!',
          description: `All ${path.blocks?.length || 0} blocks in this path are now marked as mastered.`
        })
      } else {
        toast({
          type: 'error',
          title: 'Failed to mark path as mastered',
          description: response.error || 'Please try again later.'
        })
      }
    } catch (error) {
      console.error('Failed to mark path as mastered:', error)
      toast({
        type: 'error',
        title: 'Failed to mark path as mastered',
        description: 'Please try again later.'
      })
    } finally {
      setIsMarkingAll(false)
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
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Learning Paths</span>
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
                {masteredBlocks.size > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-green-600">
                      ✓ {masteredBlocks.size} mastered
                    </span>
                  </>
                )}
              </div>
            </div>
            {api.getToken() && path.blocks.length > 0 && (
              <button
                onClick={handleMarkAllMastered}
                disabled={isMarkingAll}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingAll ? 'Marking...' : '✓ Mark All As Mastered'}
              </button>
            )}
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
                {/* Connecting line - positioned behind cards */}
                <div className="absolute left-[35px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/10 -z-10"></div>
                
                <div className="space-y-6">
                  {path.blocks.map((block, index) => {
                    const isFirst = index === 0
                    const isLast = index === path.blocks.length - 1
                    const isMastered = masteredBlocks.has(block.id)
                    
                    return (
                      <div
                        key={block.id}
                        onClick={() => router.push(`/blocks/${block.slug}`)}
                        className="relative group"
                      >
                        {/* Content card with solid background */}
                        <div className={`relative flex items-start gap-6 p-6 rounded-2xl border-2 hover:shadow-lg hover:scale-[1.01] cursor-pointer transition-all duration-300 ${
                          isMastered 
                            ? 'bg-green-50 dark:bg-green-950/50 border-green-200 hover:border-green-400' 
                            : 'bg-card border-border hover:border-primary/50'
                        } backdrop-blur-sm`}>
                          {/* Step number with glow */}
                          <div className="relative flex-shrink-0">
                            <div className={`w-14 h-14 rounded-full text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                              isMastered 
                                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                : 'bg-gradient-to-br from-primary to-primary/70'
                            }`}>
                              {isMastered ? '✓' : index + 1}
                            </div>
                            {/* Glow effect on hover */}
                            <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 ${
                              isMastered ? 'bg-green-500/30' : 'bg-primary/30'
                            }`}></div>
                          </div>
                          
                          {/* Block content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <h4 className={`font-bold text-xl leading-tight transition-colors ${
                                  isMastered ? 'text-green-800 group-hover:text-green-900' : 'group-hover:text-primary'
                                }`}>
                                  {block.title}
                                </h4>
                                {isMastered && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    Mastered
                                  </span>
                                )}
                              </div>
                              <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border ${
                                isMastered 
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              }`}>
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

