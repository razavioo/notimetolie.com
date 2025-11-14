'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'
import { AIJob } from '@/types/api'
import { useAIJobUpdates } from '@/hooks/useWebSocket'

export default function AIJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<AIJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all')

  // WebSocket for real-time updates
  useAIJobUpdates((update) => {
    if (update.type === 'ai_job_update') {
      loadJobs()
    }
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setIsLoading(true)
    const { data, error } = await api.listAIJobs()
    if (data) {
      // Sort by created_at descending
      const sorted = data.sort((a: AIJob, b: AIJob) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setJobs(sorted)
    } else {
      console.error('Failed to load AI jobs:', error)
    }
    setIsLoading(false)
  }

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return

    const { error } = await api.cancelAIJob(jobId)
    if (!error) {
      loadJobs()
    } else {
      alert(`Failed to cancel job: ${error}`)
    }
  }

  const handleViewSuggestions = (jobId: string) => {
    router.push(`/ai-jobs/${jobId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-muted text-muted-foreground'
      case 'running':
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'completed':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'failed':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'cancelled':
        return 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const activeCount = jobs.filter(j => j.status === 'running' || j.status === 'pending').length
  const completedCount = jobs.filter(j => j.status === 'completed').length
  const failedCount = jobs.filter(j => j.status === 'failed').length

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="AI Jobs"
        description="Track your AI content generation jobs"
        icon={<Loader2 className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-6xl mx-auto mt-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{jobs.length}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({jobs.length})
            </Button>
            <Button
              variant={filter === 'running' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('running')}
            >
              Running ({jobs.filter(j => j.status === 'running').length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending ({jobs.filter(j => j.status === 'pending').length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              Failed ({failedCount})
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={loadJobs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'No AI jobs yet'
                  : `No ${filter} jobs`
                }
              </p>
              <Button onClick={() => router.push('/create')}>
                Create with AI
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-5 px-5">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Left side: Status icon and job details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="flex-shrink-0 pt-0.5">
                        {getStatusIcon(job.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Title and status badge */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-semibold text-base leading-snug">
                            {job.job_type === 'content_creator' ? 'Create Block' : 
                             job.job_type === 'course_designer' ? 'Create Path' : 
                             job.job_type}
                          </h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        
                        {/* Prompt */}
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {job.input_prompt}
                        </p>
                        
                        {/* Timestamps and errors */}
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>Created {formatDate(job.created_at)}</span>
                            {job.completed_at && (
                              <span>• Completed {formatDate(job.completed_at)}</span>
                            )}
                          </div>
                          {job.error_message && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 rounded-md leading-relaxed">
                              <span className="font-semibold">Error:</span> {job.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Action buttons */}
                    <div className="flex gap-2 sm:flex-shrink-0 w-full sm:w-auto sm:pt-1">
                      {job.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleViewSuggestions(job.id)}
                          className="flex-1 sm:flex-initial"
                        >
                          View Results
                        </Button>
                      )}
                      {(job.status === 'running' || job.status === 'pending') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelJob(job.id)}
                          className="flex-1 sm:flex-initial"
                        >
                          Cancel
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push('/create')}
                          className="flex-1 sm:flex-initial"
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
