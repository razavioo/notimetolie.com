'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AIConfigFormData {
  name: string
  description?: string
  provider: 'openai' | 'anthropic' | 'custom'
  agent_type: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
  model_name: string
  api_key?: string
  api_endpoint?: string
  temperature: number
  max_tokens: number
  system_prompt?: string
  mcp_enabled: boolean
  mcp_server_url?: string
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
    can_create_blocks: initialData?.can_create_blocks ?? true,
    can_edit_blocks: initialData?.can_edit_blocks ?? false,
    can_search_web: initialData?.can_search_web ?? true,
    daily_request_limit: initialData?.daily_request_limit || 50,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const updateField = (field: keyof AIConfigFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getModelOptions = () => {
    if (formData.provider === 'openai') {
      return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
    } else if (formData.provider === 'anthropic') {
      return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    } else {
      return ['custom-model']
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                           e.target.value === 'anthropic' ? 'claude-3-sonnet-20240229' : 'custom-model')
              }}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label htmlFor="agent_type" className="block text-sm font-medium mb-2">
              Agent Type *
            </label>
            <select
              id="agent_type"
              value={formData.agent_type}
              onChange={(e) => updateField('agent_type', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="content_creator">Content Creator</option>
              <option value="content_researcher">Content Researcher</option>
              <option value="content_editor">Content Editor</option>
              <option value="course_designer">Course Designer</option>
            </select>
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
        </div>

        <div>
          <label htmlFor="api_key" className="block text-sm font-medium mb-2">
            API Key {formData.provider !== 'custom' && '(Optional - uses env var if not provided)'}
          </label>
          <input
            id="api_key"
            type="password"
            value={formData.api_key}
            onChange={(e) => updateField('api_key', e.target.value)}
            placeholder={`${formData.provider.toUpperCase()}_API_KEY`}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Will be encrypted and stored securely
          </p>
        </div>

        {formData.provider === 'custom' && (
          <div>
            <label htmlFor="api_endpoint" className="block text-sm font-medium mb-2">
              API Endpoint *
            </label>
            <input
              id="api_endpoint"
              type="url"
              value={formData.api_endpoint}
              onChange={(e) => updateField('api_endpoint', e.target.value)}
              placeholder="https://your-api.com/v1/completions"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required={formData.provider === 'custom'}
            />
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
          <label htmlFor="system_prompt" className="block text-sm font-medium mb-2">
            System Prompt (Optional)
          </label>
          <textarea
            id="system_prompt"
            value={formData.system_prompt}
            onChange={(e) => updateField('system_prompt', e.target.value)}
            placeholder="Custom instructions for the AI agent..."
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* MCP Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">MCP Integration</h3>
        
        <div className="flex items-center gap-2">
          <input
            id="mcp_enabled"
            type="checkbox"
            checked={formData.mcp_enabled}
            onChange={(e) => updateField('mcp_enabled', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="mcp_enabled" className="text-sm font-medium">
            Enable Model Context Protocol (Recommended)
          </label>
        </div>

        {formData.mcp_enabled && (
          <div>
            <label htmlFor="mcp_server_url" className="block text-sm font-medium mb-2">
              MCP Server URL
            </label>
            <input
              id="mcp_server_url"
              type="url"
              value={formData.mcp_server_url}
              onChange={(e) => updateField('mcp_server_url', e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Permissions & Limits</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="can_create_blocks"
              type="checkbox"
              checked={formData.can_create_blocks}
              onChange={(e) => updateField('can_create_blocks', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="can_create_blocks" className="text-sm">
              Can create new blocks
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="can_edit_blocks"
              type="checkbox"
              checked={formData.can_edit_blocks}
              onChange={(e) => updateField('can_edit_blocks', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="can_edit_blocks" className="text-sm">
              Can edit existing blocks
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="can_search_web"
              type="checkbox"
              checked={formData.can_search_web}
              onChange={(e) => updateField('can_search_web', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="can_search_web" className="text-sm">
              Can search web for information
            </label>
          </div>
        </div>

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
