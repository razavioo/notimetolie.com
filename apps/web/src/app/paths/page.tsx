'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PathCard } from '@/components/PathCard'
import { PathForm } from '@/components/PathForm'
import { PathPublic, PathCreate } from '@/types/api'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Paths</h1>
          <p className="text-muted-foreground">Organize blocks into structured learning journeys</p>
        </div>
        {hasPermission('create_paths') && (
          <button
            onClick={() => router.push('/paths/create')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Create Path
          </button>
        )}
      </div>

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
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No paths yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first learning path to get started
          </p>
          <button
            onClick={() => router.push('/paths/create')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Create Your First Path
          </button>
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
