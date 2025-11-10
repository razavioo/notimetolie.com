"use client"

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import type { SuggestionResponse } from '@/types/api'

export default function ModerationDashboardPage() {
  const [pending, setPending] = useState<SuggestionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadPending = async () => {
    setLoading(true)
    const res = await api.listSuggestions('pending')
    if (res.data) setPending(res.data)
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Moderator Dashboard</h1>

      {loading ? (
        <div>Loading pending suggestions...</div>
      ) : pending.length === 0 ? (
        <div className="text-muted-foreground">No pending suggestions</div>
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
  )
}

