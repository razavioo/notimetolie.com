'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Settings, Trash2, Play, X, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIConfigForm } from '@/components/AIConfigForm'
import { useAIJobUpdates } from '@/hooks/useWebSocket'

interface AIConfig {
  id: string
  name: string
  description?: string
  provider: 'openai' | 'anthropic' | 'custom'
  agent_type: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
  model_name: string
  temperature: number
  max_tokens: number
  mcp_enabled: boolean
  is_active: boolean
  created_at: string
}

interface AIJob {
  id: string
  configuration_id: string
  job_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input_prompt: string
  output_data?: any
  suggested_blocks?: string[]
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
}

export default function AIConfigPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeJobs, setActiveJobs] = useState<AIJob[]>([])
  const [jobProgress, setJobProgress] = useState<Record<string, { progress: number; message: string }>>({})

  // WebSocket for real-time updates
  const { isConnected: wsConnected } = useAIJobUpdates((update) => {
    if (update.type === 'ai_job_update') {
      // Update job status in real-time
      setActiveJobs(prev => prev.map(job => 
        job.id === update.job_id 
          ? { ...job, status: update.status, output_data: update.data?.output_data }
          : job
      ))
      
      // Remove completed/failed/cancelled jobs after a delay
      if (['completed', 'failed', 'cancelled'].includes(update.status)) {
        setTimeout(() => {
          setActiveJobs(prev => prev.filter(job => job.id !== update.job_id))
          setJobProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[update.job_id]
            return newProgress
          })
        }, 5000)
      }
    } else if (update.type === 'ai_job_progress') {
      // Update progress
      setJobProgress(prev => ({
        ...prev,
        [update.job_id]: {
          progress: update.progress,
          message: update.message || ''
        }
      }))
    }
  })

  useEffect(() => {
    if (!hasPermission('use_ai_agents')) {
      router.push('/')
      return
    }
    loadConfigurations()
    loadActiveJobs()
  }, [hasPermission])

  const loadConfigurations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v1/ai/configurations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error) {
      console.error('Failed to load AI configurations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActiveJobs = async () => {
    // TODO: Implement fetching active jobs
  }

  const getAgentTypeLabel = (type: string) => {
    const labels = {
      content_creator: 'Content Creator',
      content_researcher: 'Content Researcher',
      content_editor: 'Content Editor',
      course_designer: 'Course Designer',
    }
    return labels[type as keyof typeof labels] || type
  }

  const getProviderLabel = (provider: string) => {
    const labels = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      custom: 'Custom',
    }
    return labels[provider as keyof typeof labels] || provider
  }

  if (!hasPermission('use_ai_agents')) {
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            AI Agent Configuration
            {wsConnected ? (
              <span className="flex items-center gap-1 text-sm font-normal text-green-600 dark:text-green-400">
                <Wifi className="h-4 w-4" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-normal text-gray-500">
                <WifiOff className="h-4 w-4" />
                Offline
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage your AI assistants for content creation
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      {/* Active Jobs Section */}
      {activeJobs.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Active AI Jobs</CardTitle>
            <CardDescription>Currently running AI tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeJobs.map((job) => {
                const progress = jobProgress[job.id]
                return (
                  <div key={job.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{job.job_type}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {job.input_prompt}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            job.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            job.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {job.status}
                          </span>
                          {job.started_at && (
                            <span className="text-xs text-muted-foreground">
                              Started {new Date(job.started_at).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {job.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Cancel job */}}
                          className="flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {progress && job.status === 'running' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.message}</span>
                          <span>{Math.round(progress.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurations Grid */}
      {configs.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Get Started with AI Assistants</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Configure your first AI agent to help you create high-quality content, 
              research topics, and design learning paths using MCP integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((config) => (
            <Card key={config.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getAgentTypeLabel(config.agent_type)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Edit config */}}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Delete config */}}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.description && (
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium">{getProviderLabel(config.provider)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-medium">{config.model_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">MCP</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        config.mcp_enabled 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {config.mcp_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 flex items-center justify-center gap-2"
                    onClick={() => router.push(`/ai-config/${config.id}/create`)}
                  >
                    <Play className="h-4 w-4" />
                    Use This Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create AI Agent</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <AIConfigForm
                onSubmit={async (data) => {
                  try {
                    const response = await fetch('/api/v1/ai/configurations', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                      },
                      body: JSON.stringify(data),
                    })
                    if (response.ok) {
                      setShowCreateForm(false)
                      loadConfigurations()
                    } else {
                      const error = await response.json()
                      alert(`Error: ${error.detail || 'Failed to create agent'}`)
                    }
                  } catch (error) {
                    console.error('Failed to create agent:', error)
                    alert('Failed to create agent. Please try again.')
                  }
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
