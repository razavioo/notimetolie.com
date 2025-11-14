'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Loader2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'
import { AIConfiguration, AIJob, AIBlockSuggestion } from '@/types/api'
import { useAIJobUpdates } from '@/hooks/useWebSocket'

type ContentType = 'block' | 'path'

export default function AICreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeParam = searchParams?.get('type') as ContentType | null
  
  const [step, setStep] = useState<'type' | 'agent' | 'prompt' | 'generating' | 'review'>(typeParam ? 'agent' : 'type')
  const [contentType, setContentType] = useState<ContentType>(typeParam || 'block')
  const [configs, setConfigs] = useState<AIConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [currentJob, setCurrentJob] = useState<AIJob | null>(null)
  const [suggestions, setSuggestions] = useState<AIBlockSuggestion[]>([])
  const [jobProgress, setJobProgress] = useState<{ progress: number; message: string }>({ progress: 0, message: '' })
  const [error, setError] = useState<string | null>(null)

  // WebSocket for real-time updates
  useAIJobUpdates((update) => {
    if (!currentJob || update.job_id !== currentJob.id) return

    if (update.type === 'ai_job_update') {
      setCurrentJob(prev => prev ? { ...prev, status: update.status } : null)
      
      if (update.status === 'completed') {
        loadSuggestions(currentJob.id)
        setStep('review')
      } else if (update.status === 'failed') {
        const errorDetail = update.data?.error || 'Unknown error occurred'
        const errorMessage = `AI generation failed: ${errorDetail}. This could be due to:\n• Invalid API key\n• Insufficient API credits\n• Model unavailability\n• Rate limiting\n\nPlease check your AI agent configuration and try again.`
        setError(errorMessage)
        setStep('prompt')
      }
    } else if (update.type === 'ai_job_progress') {
      setJobProgress({
        progress: update.progress || 0,
        message: update.message || ''
      })
    }
  })

  useEffect(() => {
    if (step === 'agent') {
      loadConfigurations()
    }
  }, [step])

  const loadConfigurations = async () => {
    const { data, error } = await api.listAIConfigurations()
    if (data) {
      const active = data.filter((c: AIConfiguration) => c.is_active)
      const agentType = contentType === 'block' ? 'content_creator' : 'course_designer'
      const preferred = active.filter((c: AIConfiguration) => c.agent_type === agentType)
      const toShow = preferred.length > 0 ? preferred : active
      
      setConfigs(toShow)
      if (toShow.length > 0 && !selectedConfig) {
        setSelectedConfig(toShow[0].id)
      }
    }
  }

  const loadSuggestions = async (jobId: string) => {
    const { data, error } = await api.listAIJobSuggestions(jobId)
    if (data) {
      setSuggestions(data)
    }
  }

  const handleStartGeneration = async () => {
    if (!prompt.trim() || !selectedConfig) return

    setError(null)
    setStep('generating')
    setJobProgress({ progress: 0, message: 'Starting AI job...' })

    const agentType = contentType === 'block' ? 'content_creator' : 'course_designer'
    
    try {
      const { data, error } = await api.createAIJob({
        configuration_id: selectedConfig,
        job_type: agentType,
        input_prompt: prompt,
      })

      if (data) {
        setCurrentJob(data)
      } else {
        // Provide detailed error message
        let errorMessage = 'Failed to start AI job'
        if (error) {
          if (error.includes('401') || error.includes('Unauthorized')) {
            errorMessage = 'Authentication failed. Please sign in again.'
          } else if (error.includes('403') || error.includes('Forbidden')) {
            errorMessage = 'You do not have permission to use AI agents. Please check your account permissions.'
          } else if (error.includes('404')) {
            errorMessage = 'AI agent configuration not found. Please select a valid agent.'
          } else if (error.includes('429') || error.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again later.'
          } else if (error.includes('500')) {
            errorMessage = 'Server error occurred. Please try again in a few moments.'
          } else if (error.includes('network') || error.includes('fetch')) {
            errorMessage = 'Network connection failed. Please check your internet connection and try again.'
          } else {
            errorMessage = `Error: ${error}`
          }
        }
        setError(errorMessage)
        setStep('prompt')
      }
    } catch (err: any) {
      console.error('AI job creation error:', err)
      setError(`Unexpected error: ${err.message || 'Please check your connection and try again.'}`)
      setStep('prompt')
    }
  }

  const handleAcceptSuggestion = async (suggestion: AIBlockSuggestion) => {
    // In a real implementation, this would approve the suggestion via API
    // For now, navigate to the created block/path
    if (contentType === 'block') {
      router.push(`/blocks/${suggestion.slug}`)
    } else {
      router.push(`/paths/${suggestion.slug}`)
    }
  }

  const handleReject = () => {
    setStep('prompt')
    setCurrentJob(null)
    setSuggestions([])
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {['type', 'agent', 'prompt', 'review'].map((s, idx) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === s ? 'bg-primary text-primary-foreground' :
            ['type', 'agent', 'prompt'].indexOf(step) > idx ? 'bg-primary/20 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {idx + 1}
          </div>
          {idx < 3 && (
            <div className={`w-12 h-0.5 ${
              ['type', 'agent', 'prompt'].indexOf(step) > idx ? 'bg-primary/20' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="AI Content Creator"
        description="Create high-quality blocks or paths with AI assistance"
        icon={<Sparkles className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto mt-8">
        {renderStepIndicator()}

        {/* Step 1: Choose Content Type */}
        {step === 'type' && (
          <Card>
            <CardHeader>
              <CardTitle>What would you like to create?</CardTitle>
              <CardDescription>Choose the type of content you want AI to help you with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={() => {
                  setContentType('block')
                  setStep('agent')
                }}
                className="w-full p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Create a Block</h3>
                    <p className="text-muted-foreground text-sm">
                      An atomic unit of knowledge - a tutorial, explanation, or guide on a specific topic
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setContentType('path')
                  setStep('agent')
                }}
                className="w-full p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Create a Path</h3>
                    <p className="text-muted-foreground text-sm">
                      A structured learning journey - a complete course or guide composed of multiple blocks
                    </p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose AI Agent */}
        {step === 'agent' && (
          <Card>
            <CardHeader>
              <CardTitle>Select AI Agent</CardTitle>
              <CardDescription>Choose which AI agent will help create your {contentType}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configs.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No AI agents configured</p>
                  <Button onClick={() => router.push('/ai-config')}>
                    Configure AI Agent
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {configs.map((config) => (
                    <button
                      key={config.id}
                      onClick={() => setSelectedConfig(config.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        selectedConfig === config.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">{config.name}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">{config.provider}</span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">{config.model_name}</span>
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

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('type')} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep('prompt')}
                  disabled={!selectedConfig}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Enter Prompt */}
        {step === 'prompt' && (
          <Card>
            <CardHeader>
              <CardTitle>Describe what you want to create</CardTitle>
              <CardDescription>
                Be specific about the topic, target audience, and any requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="font-medium">Error</p>
                  </div>
                  <p className="text-sm whitespace-pre-line ml-7">{error}</p>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  contentType === 'block'
                    ? "E.g., Create a beginner tutorial about Python async/await with code examples and practical use cases"
                    : "E.g., Create a complete learning path for mastering React from basics to advanced concepts"
                }
                className="w-full min-h-[200px] px-4 py-3 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                autoFocus
              />

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-sm">Tips for better results:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be specific about the target audience (beginner, intermediate, advanced)</li>
                  <li>• Mention desired depth and detail level</li>
                  <li>• Include any specific requirements or constraints</li>
                  <li>• Specify if you want code examples, diagrams, or other media</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('agent')} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleStartGeneration}
                  disabled={!prompt.trim()}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI is working on your {contentType}</h3>
                  <p className="text-muted-foreground">{jobProgress.message || 'Please wait...'}</p>
                </div>
                {jobProgress.progress > 0 && (
                  <div className="max-w-md mx-auto">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${jobProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{jobProgress.progress}% complete</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Review Suggestions */}
        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Review AI Suggestions</CardTitle>
              <CardDescription>
                Review and approve the content generated by AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No suggestions generated. Please try again.
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-6 border rounded-lg space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold mb-2">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mb-4">{suggestion.description}</p>
                      </div>

                      {suggestion.tags && suggestion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {suggestion.tags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Create
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleReject}
                          className="flex-1"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
