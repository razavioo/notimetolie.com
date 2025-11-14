'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, X, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { AIConfiguration, AIJob, AIBlockSuggestion } from '@/types/api'
import { useAIJobUpdates } from '@/hooks/useWebSocket'

interface AIAssistantProps {
  onSuggestionAccepted: (suggestion: AIBlockSuggestion) => void
  defaultPrompt?: string
  agentType?: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
}

export function AIAssistant({ onSuggestionAccepted, defaultPrompt = '', agentType = 'content_creator' }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [configs, setConfigs] = useState<AIConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>('')
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [isLoading, setIsLoading] = useState(false)
  const [currentJob, setCurrentJob] = useState<AIJob | null>(null)
  const [suggestions, setSuggestions] = useState<AIBlockSuggestion[]>([])
  const [jobProgress, setJobProgress] = useState<{ progress: number; message: string }>({ progress: 0, message: '' })

  // WebSocket for real-time updates
  useAIJobUpdates((update) => {
    if (!currentJob || update.job_id !== currentJob.id) return

    if (update.type === 'ai_job_update') {
      setCurrentJob(prev => prev ? { ...prev, status: update.status } : null)
      
      if (update.status === 'completed') {
        loadSuggestions(currentJob.id)
        setIsLoading(false)
      } else if (update.status === 'failed') {
        setIsLoading(false)
        alert(`AI job failed: ${update.data?.error || 'Unknown error'}`)
      }
    } else if (update.type === 'ai_job_progress') {
      setJobProgress({
        progress: update.progress || 0,
        message: update.message || ''
      })
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadConfigurations()
    }
  }, [isOpen])

  const loadConfigurations = async () => {
    const { data, error } = await api.listAIConfigurations()
    if (data) {
      // Filter by active status and optionally prefer matching agent_type
      const active = data.filter((c: AIConfiguration) => c.is_active)
      const preferred = active.filter((c: AIConfiguration) => c.agent_type === agentType)
      
      // Use preferred agents if available, otherwise show all active
      const toShow = preferred.length > 0 ? preferred : active
      setConfigs(toShow)
      
      if (toShow.length > 0 && !selectedConfig) {
        setSelectedConfig(toShow[0].id)
      }
    } else if (error) {
      console.error('Failed to load AI configurations:', error)
    }
  }

  const loadSuggestions = async (jobId: string) => {
    const { data, error } = await api.listAIJobSuggestions(jobId)
    if (data) {
      setSuggestions(data)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedConfig) return

    setIsLoading(true)
    setJobProgress({ progress: 0, message: 'Starting AI job...' })

    const { data, error } = await api.createAIJob({
      configuration_id: selectedConfig,
      job_type: agentType,
      input_prompt: prompt,
    })

    if (data) {
      setCurrentJob(data)
    } else {
      setIsLoading(false)
      alert(`Error: ${error || 'Failed to start AI job'}`)
    }
  }

  const handleAcceptSuggestion = (suggestion: AIBlockSuggestion) => {
    onSuggestionAccepted(suggestion)
    setIsOpen(false)
    resetState()
  }

  const resetState = () => {
    setPrompt(defaultPrompt)
    setCurrentJob(null)
    setSuggestions([])
    setJobProgress({ progress: 0, message: '' })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        AI Assistant
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {
      setIsOpen(false)
      resetState()
    }}>
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>AI Content Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false)
                resetState()
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            Use AI to help create high-quality content with MCP integration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Configuration Selection */}
          {!currentJob && (
            <div>
              <label htmlFor="ai_config" className="block text-sm font-medium mb-2">
                Select AI Agent
              </label>
              {configs.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  <p>No AI agents configured.</p>
                  <p className="text-sm mt-1">
                    <a href="/ai-config" className="text-primary hover:underline">
                      Create one in AI Configuration
                    </a>
                  </p>
                </div>
              ) : (
                <select
                  id="ai_config"
                  value={selectedConfig}
                  onChange={(e) => setSelectedConfig(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {configs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.provider} - {config.model_name})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Prompt Input */}
          {!currentJob && (
            <div>
              <label htmlFor="ai_prompt" className="block text-sm font-medium mb-2">
                What would you like to create?
              </label>
              <textarea
                id="ai_prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Create a beginner tutorial about Python async/await with code examples"
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* AI Job Progress */}
          {currentJob && currentJob.status !== 'completed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">
                  {currentJob.status === 'pending' && 'Waiting to start...'}
                  {currentJob.status === 'running' && 'AI is working...'}
                  {currentJob.status === 'failed' && 'Job failed'}
                  {currentJob.status === 'cancelled' && 'Job cancelled'}
                </span>
              </div>
              
              {currentJob.status === 'running' && jobProgress.message && (
                <>
                  <p className="text-sm text-muted-foreground">{jobProgress.message}</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${jobProgress.progress}%` }}
                    />
                  </div>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await api.cancelAIJob(currentJob.id)
                  resetState()
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">AI Generated {suggestions.length} Suggestion(s)</h3>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <CardDescription className="mt-1">
                            Confidence: {Math.round(suggestion.confidence_score * 100)}%
                          </CardDescription>
                        </div>
                        {suggestion.tags && suggestion.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {suggestion.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="text-sm line-clamp-3">{suggestion.content}</p>
                      </div>

                      {suggestion.ai_rationale && (
                        <div className="p-2 bg-muted rounded text-sm">
                          <p className="font-medium mb-1">AI Rationale:</p>
                          <p className="text-muted-foreground">{suggestion.ai_rationale}</p>
                        </div>
                      )}

                      {suggestion.source_urls && suggestion.source_urls.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            Sources:
                          </p>
                          {suggestion.source_urls.slice(0, 2).map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline block truncate"
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        className="w-full"
                      >
                        Use This Content
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!currentJob && configs.length > 0 && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim() || !selectedConfig}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setIsOpen(false)
                  resetState()
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
