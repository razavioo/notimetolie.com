'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface AIConfigFormData {
  name: string
  description?: string
  provider: 'openai' | 'anthropic' | 'openai_compatible'
  agent_type: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
  model_name: string
  api_key?: string
  api_endpoint?: string
  temperature: number
  max_tokens: number
  system_prompt?: string
  mcp_enabled: boolean
  mcp_server_url?: string
  mcp_capable: boolean
  can_create_blocks: boolean
  can_edit_blocks: boolean
  can_search_web: boolean
  daily_request_limit: number
}

interface AIConfigFormProps {
  onSubmit: (data: AIConfigFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<AIConfigFormData>
  isLoading?: boolean
}

export function AIConfigForm({ onSubmit, onCancel, initialData, isLoading = false }: AIConfigFormProps) {
  const [formData, setFormData] = useState<AIConfigFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    provider: initialData?.provider || 'openai',
    agent_type: initialData?.agent_type || 'content_creator',
    model_name: initialData?.model_name || 'gpt-4',
    api_key: initialData?.api_key || '',
    api_endpoint: initialData?.api_endpoint || '',
    temperature: initialData?.temperature || 0.7,
    max_tokens: initialData?.max_tokens || 2000,
    system_prompt: initialData?.system_prompt || '',
    mcp_enabled: initialData?.mcp_enabled ?? true,
    mcp_server_url: initialData?.mcp_server_url || 'http://localhost:8000',
    mcp_capable: initialData?.mcp_capable ?? false,
    can_create_blocks: initialData?.can_create_blocks ?? true,
    can_edit_blocks: initialData?.can_edit_blocks ?? false,
    can_search_web: initialData?.can_search_web ?? true,
    daily_request_limit: initialData?.daily_request_limit || 50,
  })

  // Pre-defined system prompts for each agent type
  const SYSTEM_PROMPTS = {
    content_creator: `You are a Content Creator AI agent. Your role is to generate new, original knowledge blocks.

Your responsibilities:
- Research topics thoroughly and create comprehensive, accurate content
- Structure information in a clear, digestible format
- Include relevant examples and code snippets where appropriate
- Find and suggest relevant images or diagrams
- Ensure content is self-contained and meaningful
- Cite sources when using external information
- Avoid duplicating existing content - always search first

Guidelines:
- Be accurate and factual
- Use clear, concise language
- Break complex topics into understandable parts
- Include practical examples
- Consider the target audience level`,

    content_researcher: `You are a Content Researcher AI agent. Your role is to find and compile information from existing sources.

Your responsibilities:
- Search the web for authoritative sources on topics
- Discover related blocks in the knowledge base
- Compile research findings with proper citations
- Identify gaps in existing content
- Suggest additional resources and references
- Evaluate source credibility and relevance

Guidelines:
- Prioritize authoritative and recent sources
- Provide comprehensive source citations
- Summarize findings clearly
- Highlight connections between topics
- Note conflicting information when found`,

    content_editor: `You are a Content Editor AI agent. Your role is to improve and refine existing content.

Your responsibilities:
- Enhance clarity and readability
- Fix grammar, spelling, and formatting errors
- Improve structure and flow
- Optimize for comprehension
- Ensure consistency in style and terminology
- Suggest better examples or explanations
- Update outdated information

Guidelines:
- Preserve the author's intent and voice
- Make constructive improvements
- Focus on clarity over complexity
- Maintain factual accuracy
- Provide rationale for significant changes`,

    course_designer: `You are a Course Designer AI agent. Your role is to organize content blocks into logical learning paths.

Your responsibilities:
- Select appropriate blocks for learning objectives
- Order content in a logical progression
- Identify prerequisites and dependencies
- Fill gaps with suggestions for missing content
- Ensure smooth transitions between topics
- Balance difficulty and pacing
- Create comprehensive learning journeys

Guidelines:
- Start with fundamentals and build complexity
- Consider learner progression
- Maintain clear learning objectives
- Ensure each step builds on previous knowledge
- Provide alternative paths when appropriate`
  }

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      const agentType = initialData.agent_type || 'content_creator'
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        provider: initialData.provider || 'openai',
        agent_type: agentType,
        model_name: initialData.model_name || 'gpt-4',
        api_key: initialData.api_key || '',
        api_endpoint: initialData.api_endpoint || '',
        temperature: initialData.temperature || 0.7,
        max_tokens: initialData.max_tokens || 2000,
        system_prompt: initialData.system_prompt || SYSTEM_PROMPTS[agentType as keyof typeof SYSTEM_PROMPTS] || '',
        mcp_enabled: true, // Always enabled
        mcp_server_url: initialData.mcp_server_url || 'http://localhost:8000',
        mcp_capable: true, // Auto-detect as capable
        can_create_blocks: true, // Determined by agent_type
        can_edit_blocks: true, // Determined by agent_type
        can_search_web: true, // Always enabled
        daily_request_limit: initialData.daily_request_limit || 50,
      })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        provider: 'openai',
        agent_type: 'content_creator',
        model_name: 'gpt-4',
        api_key: '',
        api_endpoint: '',
        temperature: 0.7,
        max_tokens: 2000,
        system_prompt: SYSTEM_PROMPTS.content_creator,
        mcp_enabled: true,
        mcp_server_url: 'http://localhost:8000',
        mcp_capable: true,
        can_create_blocks: true,
        can_edit_blocks: false,
        can_search_web: true,
        daily_request_limit: 50,
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const updateField = (field: keyof AIConfigFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAgentTypeChange = (newAgentType: string) => {
    const agentType = newAgentType as keyof typeof SYSTEM_PROMPTS
    setFormData(prev => ({
      ...prev,
      agent_type: newAgentType as any,
      system_prompt: SYSTEM_PROMPTS[agentType] || prev.system_prompt
    }))
  }

  const handleUseDefaultPrompt = () => {
    const agentType = formData.agent_type as keyof typeof SYSTEM_PROMPTS
    setFormData(prev => ({
      ...prev,
      system_prompt: SYSTEM_PROMPTS[agentType]
    }))
  }

  const getModelOptions = () => {
    if (formData.provider === 'openai') {
      return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
    } else if (formData.provider === 'anthropic') {
      return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    } else {
      return [] // OpenAI Compatible allows custom model names
    }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🤖 AI Agent Configuration
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Agent Type</strong> determines capabilities (create, edit, research, or design)</li>
          <li>• <strong>MCP (Model Context Protocol)</strong> is always enabled for context-aware content generation</li>
          <li>• <strong>System Prompts</strong> can be customized or use the default for each agent type</li>
          <li>• Each agent is restricted to its designated purpose</li>
        </ul>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Agent Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Content Creator Pro"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="What will this agent be used for?"
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium mb-2">
              AI Provider *
            </label>
            <select
              id="provider"
              value={formData.provider}
              onChange={(e) => {
                updateField('provider', e.target.value)
                updateField('model_name', e.target.value === 'openai' ? 'gpt-4' : 
                           e.target.value === 'anthropic' ? 'claude-3-sonnet-20240229' : '')
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openai_compatible">OpenAI Compatible</option>
            </select>
          </div>

          <div>
            <label htmlFor="agent_type" className="block text-sm font-medium mb-2">
              Agent Type *
            </label>
            <select
              id="agent_type"
              value={formData.agent_type}
              onChange={(e) => handleAgentTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="content_creator">Content Creator - Generate new blocks</option>
              <option value="content_researcher">Content Researcher - Find and compile resources</option>
              <option value="content_editor">Content Editor - Improve existing content</option>
              <option value="course_designer">Course Designer - Organize learning paths</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Agent type determines its capabilities and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Model Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Model Configuration</h3>
        
        <div>
          <label htmlFor="model_name" className="block text-sm font-medium mb-2">
            Model *
          </label>
          {formData.provider === 'openai_compatible' ? (
            <input
              id="model_name"
              type="text"
              value={formData.model_name}
              onChange={(e) => updateField('model_name', e.target.value)}
              placeholder="e.g., llama2, mistral, codellama, etc."
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          ) : (
            <select
              id="model_name"
              value={formData.model_name}
              onChange={(e) => updateField('model_name', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {getModelOptions().map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          )}
          {formData.provider === 'openai_compatible' && (
            <p className="text-xs text-muted-foreground mt-1">
              Enter the exact model name your endpoint supports
            </p>
          )}
        </div>

        <div>
          <label htmlFor="api_key" className="block text-sm font-medium mb-2">
            API Key {initialData ? '(Leave empty to keep existing key)' : '(Optional - uses env var if not provided)'}
          </label>
          <input
            id="api_key"
            type="password"
            value={formData.api_key}
            onChange={(e) => updateField('api_key', e.target.value)}
            placeholder={initialData ? 'Enter new key to replace existing key' : `${formData.provider.toUpperCase()}_API_KEY`}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {initialData 
              ? 'Encrypted and stored securely. Only enter a value to update the existing key.' 
              : 'Will be encrypted and stored securely. If not provided, the system will use environment variables.'}
          </p>
        </div>

        {formData.provider === 'openai_compatible' && (
          <div>
            <label htmlFor="api_endpoint" className="block text-sm font-medium mb-2">
              API Endpoint * (OpenAPI-compatible)
            </label>
            <input
              id="api_endpoint"
              type="url"
              value={formData.api_endpoint}
              onChange={(e) => updateField('api_endpoint', e.target.value)}
              placeholder="https://your-api.com/v1/completions"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required={formData.provider === 'openai_compatible'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Any OpenAPI-compatible endpoint (e.g., Ollama, LM Studio, vLLM, LocalAI, or custom deployments)
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium mb-2">
              Temperature: {formData.temperature}
            </label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Focused</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          <div>
            <label htmlFor="max_tokens" className="block text-sm font-medium mb-2">
              Max Tokens
            </label>
            <input
              id="max_tokens"
              type="number"
              min="100"
              max="100000"
              step="100"
              value={formData.max_tokens}
              onChange={(e) => updateField('max_tokens', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="system_prompt" className="block text-sm font-medium">
              System Prompt
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseDefaultPrompt}
              className="text-xs"
            >
              Use Default for {getAgentTypeLabel(formData.agent_type)}
            </Button>
          </div>
          <textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => updateField('system_prompt', e.target.value)}
            placeholder="Instructions for the AI agent..."
            rows={8}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Customize the agent's behavior or use the default prompt for the selected agent type
          </p>
        </div>
      </div>

      {/* Request Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Request Limits</h3>

        <div>
          <label htmlFor="daily_request_limit" className="block text-sm font-medium mb-2">
            Daily Request Limit
          </label>
          <input
            id="daily_request_limit"
            type="number"
            min="1"
            max="1000"
            value={formData.daily_request_limit}
            onChange={(e) => updateField('daily_request_limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading || !formData.name}
          className="flex-1"
        >
          {isLoading ? 'Creating...' : initialData ? 'Update Agent' : 'Create Agent'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
