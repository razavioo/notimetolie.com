"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { SuggestionResponse } from '@/types/api'
import { Shield, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

export default function ModerationDashboardPage() {
  const [pending, setPending] = useState<SuggestionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPending = async () => {
    setLoading(true)
    setError(null)
    const res = await api.listSuggestions('pending')
    if (res.error) {
      // Check if it's a permission error
      if (res.error.includes('403') || res.error.includes('permission')) {
        setError('You do not have permission to access moderation features. You need Moderator or Admin role.')
      } else {
        setError(res.error)
      }
    } else if (res.data) {
      setPending(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    const res = await api.approveSuggestion(id)
    if (res.data) {
      setPending(prev => prev.filter(s => s.id !== id))
    }
    setActionLoading(null)
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    const res = await api.rejectSuggestion(id)
    if (res.data) {
      setPending(prev => prev.filter(s => s.id !== id))
    }
    setActionLoading(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Moderation"
        description="Review and manage content suggestions"
        icon={<Shield className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto">

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Access Denied
              </h2>
              <p className="text-red-800 dark:text-red-200 mb-4">
                {error}
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-red-200 dark:border-red-700">
                <h3 className="font-semibold mb-2 text-sm">How to get access:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Contact an administrator</li>
                  <li>Or run this command to promote your user:
                    <code className="block mt-1 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">
                      python apps/api/scripts/promote_user_to_admin.py YOUR_USERNAME
                    </code>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading pending suggestions...</span>
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No pending suggestions</p>
          <p className="text-sm mt-2">All caught up! Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(s => (
            <div key={s.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  {s.content && (
                    <p className="text-sm text-gray-700 mt-1">{s.content}</p>
                  )}
                  <p className="text-sm mt-2"><span className="font-medium">Summary:</span> {s.change_summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">Created {formatDate(s.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
                    onClick={() => handleApprove(s.id)}
                    disabled={actionLoading === s.id}
                  >
                    {actionLoading === s.id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
                    onClick={() => handleReject(s.id)}
                    disabled={actionLoading === s.id}
                  >
                    {actionLoading === s.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

