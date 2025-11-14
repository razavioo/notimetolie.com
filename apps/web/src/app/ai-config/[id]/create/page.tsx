'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AIAssistant } from '@/components/AIAssistant'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UseAIAgentPage() {
  const params = useParams()
  const router = useRouter()
  const configId = params.id as string
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [configId])

  const loadConfig = async () => {
    const { data, error } = await api.getAIConfiguration(configId)
    if (data) {
      setConfig(data)
    } else {
      alert('AI configuration not found')
      router.push('/ai-config')
    }
    setIsLoading(false)
  }

  const handleSuggestionAccepted = async (suggestion: any) => {
    router.push(`/blocks/${suggestion.slug}`)
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!config) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/ai-config')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Agents
        </Button>
      </div>

      <PageHeader
        title={`Use: ${config.name}`}
        description={config.description || `Create content with ${config.model_name}`}
        icon={<Sparkles className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <AIAssistant
              onSuggestionAccepted={handleSuggestionAccepted}
              agentType={config.agent_type}
              defaultPrompt=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
