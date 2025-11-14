'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Loader2, CheckCircle, AlertCircle, ArrowLeft, XCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'
import { AIConfiguration, AIJob, AIBlockSuggestion } from '@/types/api'
import { useAIJobUpdates } from '@/hooks/useWebSocket'

type ContentType = 'block' | 'path'
type ViewMode = 'create' | 'jobs'

export default function UnifiedAIPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams?.get('type') as ContentType | null
  const viewParam = searchParams?.get('view') as ViewMode | null
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam || 'create')
  const [contentType, setContentType] = useState<ContentType>(typeParam || 'block')
  
  // Create flow state
  const [configs, setConfigs] = useState<AIConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Job state
  const [allJobs, setAllJobs] = useState<AIJob[]>([])
  const [currentJob, setCurrentJob] = useState<AIJob | null>(null)
  const [suggestions, setSuggestions] = useState<AIBlockSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [jobFilter, setJobFilter] = useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all')
  
  // Track previous job status to only update on changes
  const prevJobStatus = useRef<string | null>(null)

  // WebSocket for real-time updates
  useAIJobUpdates((update) => {
    if (update.type === 'ai_job_update') {
      const jobId = update.job_id
      const newStatus = update.status
      
      // Only update if status actually changed
      if (currentJob && jobId === currentJob.id && newStatus !== prevJobStatus.current) {
        prevJobStatus.current = newStatus
        setCurrentJob(prev => prev ? { ...prev, status: newStatus } : null)
        
        if (newStatus === 'completed') {
          loadSuggestions(jobId)
        } else if (newStatus === 'failed') {
          setError(update.data?.error || 'Job failed. Please check your AI configuration and try again.')
        }
      }
      
      // Refresh jobs list only if we're viewing jobs
      if (viewMode === 'jobs') {
        loadJobs()
      }
    }
  })

  useEffect(() => {
    if (viewMode === 'create') {
      loadConfigurations()
    } else {
      loadJobs()
    }
  }, [viewMode])

  const loadConfigurations = async () => {
    const { data } = await api.listAIConfigurations()
    if (data) {
      const active = data.filter((c: AIConfiguration) => c.is_active)
      setConfigs(active)
      if (active.length > 0 && !selectedConfig) {
        setSelectedConfig(active[0].id)
      }
    }
  }

  const loadJobs = async () => {
    setIsLoading(true)
    const { data } = await api.listAIJobs()
    if (data) {
      const sorted = data.sort((a: AIJob, b: AIJob) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setAllJobs(sorted)
    }
    setIsLoading(false)
  }

  const loadSuggestions = async (jobId: string) => {
    const { data } = await api.listAIJobSuggestions(jobId)
    if (data) {
      setSuggestions(data)
    }
  }

  const handleStartGeneration = async () => {
    if (!prompt.trim() || !selectedConfig) return

    const config = configs.find(c => c.id === selectedConfig)
    if (!config) {
      setError('Selected AI configuration not found')
      return
    }

    // Note: API key validation is done on the backend
    // The backend will use the encrypted key or fall back to environment variables
    setError(null)
    setCurrentJob(null)
    prevJobStatus.current = null

    const agentType = contentType === 'block' ? 'content_creator' : 'course_designer'
    
    try {
      const { data, error } = await api.createAIJob({
        configuration_id: selectedConfig,
        job_type: agentType,
        input_prompt: prompt,
      })

      if (data) {
        setCurrentJob(data)
        prevJobStatus.current = data.status
      } else {
        setError(error || 'Failed to start AI job')
      }
    } catch (err: any) {
      console.error('AI job creation error:', err)
      setError(`Unexpected error: ${err.message}`)
    }
  }

  const handleCancelJob = async (jobId: string) => {
    const { error } = await api.cancelAIJob(jobId)
    if (!error) {
      setCurrentJob(null)
      prevJobStatus.current = null
      if (viewMode === 'jobs') {
        loadJobs()
      }
    }
  }

  const handleReset = () => {
    setCurrentJob(null)
    setSuggestions([])
    setError(null)
    prevJobStatus.current = null
  }

  const handleAcceptSuggestion = async (suggestion: AIBlockSuggestion) => {
    // Approve and navigate
    const { error } = await api.approveAISuggestion(suggestion.id)
    if (!error) {
      if (contentType === 'block') {
        router.push(`/blocks/${suggestion.slug}`)
      } else {
        router.push(`/paths/${suggestion.slug}`)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const filteredJobs = allJobs.filter(job => {
    if (jobFilter === 'all') return true
    return job.status === jobFilter
  })

  const activeCount = allJobs.filter(j => j.status === 'running' || j.status === 'pending').length
  const completedCount = allJobs.filter(j => j.status === 'completed').length

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="AI Content Assistant"
        description="Use AI to help create high-quality content with MCP integration"
        icon={<Sparkles className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-6xl mx-auto mt-8">
        {/* View Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setViewMode('create')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'create'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setViewMode('jobs')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'jobs'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Jobs
            {activeCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* CREATE VIEW */}
        {viewMode === 'create' && (
          <div className="space-y-6">
            {/* Content Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>What do you want to create?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setContentType('block')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      contentType === 'block'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <h3 className="font-semibold mb-1">Block</h3>
                    <p className="text-sm text-muted-foreground">Single topic or tutorial</p>
                  </button>
                  <button
                    onClick={() => setContentType('path')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      contentType === 'path'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <h3 className="font-semibold mb-1">Path</h3>
                    <p className="text-sm text-muted-foreground">Complete learning journey</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select AI Agent</CardTitle>
                <CardDescription>Choose which AI will generate your content</CardDescription>
              </CardHeader>
              <CardContent>
                {configs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No AI agents configured</p>
                    <Button onClick={() => router.push('/ai-config')}>
                      Configure AI Agent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {configs.map((config) => (
                      <button
                        key={config.id}
                        onClick={() => setSelectedConfig(config.id)}
                        className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                          selectedConfig === config.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{config.name}</h4>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                {config.provider}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                {config.model_name}
                              </span>
                            </div>
                          </div>
                          {selectedConfig === config.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt Input */}
            <Card>
              <CardHeader>
                <CardTitle>Describe what you want to create</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`E.g., Create a ${contentType === 'block' ? 'tutorial about async JavaScript with examples' : 'complete React learning path from basics to advanced'}`}
                  className="w-full min-h-[150px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                  disabled={!!currentJob}
                />

                {currentJob ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      {getStatusIcon(currentJob.status)}
                      <div className="flex-1">
                        <p className="font-medium">
                          {currentJob.status === 'pending' && 'Waiting to start...'}
                          {currentJob.status === 'running' && 'AI is working on your content...'}
                          {currentJob.status === 'completed' && 'Generation complete!'}
                          {currentJob.status === 'failed' && 'Generation failed'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Started {formatDate(currentJob.created_at)}
                        </p>
                      </div>
                      {(currentJob.status === 'pending' || currentJob.status === 'running') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelJob(currentJob.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {currentJob.status === 'completed' && suggestions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Review Suggestions</h4>
                        {suggestions.map((suggestion, idx) => (
                          <div key={idx} className="p-4 border rounded-lg space-y-3">
                            <h5 className="font-medium">{suggestion.title}</h5>
                            {suggestion.tags && suggestion.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {suggestion.tags.map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(suggestion)}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve & Create
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" onClick={handleReset} className="w-full">
                          Create Another
                        </Button>
                      </div>
                    )}

                    {(currentJob.status === 'failed' || currentJob.status === 'cancelled') && (
                      <Button variant="outline" onClick={handleReset} className="w-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleStartGeneration}
                    disabled={!prompt.trim() || !selectedConfig}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* JOBS VIEW */}
        {viewMode === 'jobs' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{activeCount}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{completedCount}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{allJobs.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {['all', 'running', 'completed', 'failed'].map((filter) => (
                  <Button
                    key={filter}
                    variant={jobFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setJobFilter(filter as any)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={loadJobs} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Jobs List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No jobs found</p>
                  <Button onClick={() => setViewMode('create')}>Create New</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(job.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {job.job_type === 'content_creator' ? 'Create Block' : 'Create Path'}
                            </h4>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {job.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {job.input_prompt}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(job.created_at)}
                          </p>
                          {job.error_message && (
                            <p className="text-xs text-destructive mt-2">
                              Error: {job.error_message}
                            </p>
                          )}
                        </div>
                        {job.status === 'completed' && (
                          <Button size="sm" onClick={async () => {
                            await loadSuggestions(job.id)
                            setCurrentJob(job)
                            setViewMode('create')
                          }}>
                            View
                          </Button>
                        )}
                        {(job.status === 'running' || job.status === 'pending') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelJob(job.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
