'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PathCard } from '@/components/PathCard'
import { PathForm } from '@/components/PathForm'
import { PathPublic, PathCreate } from '@/types/api'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { Plus, Route, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PathsPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()
  const [paths, setPaths] = useState<PathPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPath, setEditingPath] = useState<PathPublic | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadPaths()
  }, [])

  const loadPaths = async () => {
    try {
      setIsLoading(true)
      const response = await api.getPaths()
      if (response.data) setPaths(response.data)
      else setPaths([])
    } catch (error) {
      console.error('Failed to load paths:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePath = async (data: PathCreate) => {
    try {
      setIsSubmitting(true)
      const response = await api.createPath(data)
      if (response.data) {
        setPaths(prev => [response.data!, ...prev])
        setShowForm(false)
      } else {
        throw new Error(response.error || 'Failed to create path')
      }
    } catch (error) {
      console.error('Failed to create path:', error)
      alert('Failed to create path. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePath = async (pathId: string) => {
    if (!confirm('Are you sure you want to delete this path?')) return

    try {
      await api.deletePath(pathId)
      setPaths(prev => prev.filter(p => p.id !== pathId))
    } catch (error) {
      console.error('Failed to delete path:', error)
      alert('Failed to delete path. Please try again.')
    }
  }

  const handleViewPath = (path: PathPublic) => {
    router.push(`/paths/${path.slug}`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading paths...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Learning Paths"
        description="Organize blocks into structured learning journeys"
        icon={<Route className="h-8 w-8 text-primary" />}
        actions={
          hasPermission('create_paths') ? (
            <div className="flex gap-2">
              {hasPermission('use_ai_agents') && (
                <Button
                  onClick={() => router.push('/paths/create-with-ai')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Create with AI
                </Button>
              )}
              <Button
                onClick={() => router.push('/paths/create')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Path
              </Button>
            </div>
          ) : undefined
        }
      />

      {(showForm || editingPath) && (
        <div className="mb-8 p-6 border rounded-lg bg-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingPath ? 'Edit Path' : 'Create New Path'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingPath(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <PathForm
            onSubmit={handleCreatePath}
            initialData={editingPath ? {
              title: editingPath.title,
              slug: editingPath.slug,
              block_ids: editingPath.blocks.map(b => b.id)
            } : undefined}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {paths.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Route className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Learning Paths Yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Create your first learning path to organize blocks into structured learning journeys
          </p>
          {hasPermission('create_paths') && (
            <div className="flex gap-2 justify-center">
              {hasPermission('use_ai_agents') && (
                <Button
                  onClick={() => router.push('/paths/create-with-ai')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Create with AI
                </Button>
              )}
              <Button
                onClick={() => router.push('/paths/create')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Path
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              onView={handleViewPath}
              onDelete={handleDeletePath}
            />
          ))}
        </div>
      )}
    </div>
  )
}
