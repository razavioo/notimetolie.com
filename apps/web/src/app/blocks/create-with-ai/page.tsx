'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { AIAssistant } from '@/components/AIAssistant'
import { BlockForm } from '@/components/BlockForm'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { AIBlockSuggestion } from '@/types/api'

export default function CreateWithAIPage() {
  const router = useRouter()
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIBlockSuggestion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSuggestionAccepted = (suggestion: AIBlockSuggestion) => {
    setSelectedSuggestion(suggestion)
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    
    try {
      // Create the block
      const blockData = {
        title: data.title,
        slug: data.slug,
        block_type: data.block_type || 'text',
        content: data.content,
        language: data.language,
        tags: data.tags,
      }
      
      const { data: block, error } = await api.createBlock(blockData)
      
      if (block && selectedSuggestion) {
        // Approve the AI suggestion
        await api.approveAISuggestion(selectedSuggestion.id)
        
        alert('Block created successfully from AI suggestion!')
        router.push(`/blocks/${block.slug}`)
      } else if (error) {
        alert(`Error: ${error}`)
      }
    } catch (error) {
      console.error('Failed to create block:', error)
      alert('Failed to create block. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Create Block with AI
          </div>
        }
        description="Use AI to generate content suggestions, then review and customize before publishing"
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="mt-8 max-w-4xl mx-auto">
        {!selectedSuggestion ? (
          <div className="flex items-center justify-center py-12">
            <AIAssistant
              onSuggestionAccepted={handleSuggestionAccepted}
              agentType="content_creator"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm mb-1">✨ AI Suggestion Accepted</p>
                  <p className="text-sm text-muted-foreground">
                    Review and customize the content below before publishing
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSuggestion(null)}
                >
                  Try Another
                </Button>
              </div>
            </div>

            <BlockForm
              initialData={{
                title: selectedSuggestion.title,
                slug: selectedSuggestion.slug,
                block_type: selectedSuggestion.block_type,
                content: [], // Will be parsed from suggestion.content
                language: selectedSuggestion.language,
                tags: selectedSuggestion.tags,
              }}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  )
}
