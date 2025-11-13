export interface BlockPublic {
  id: string
  title: string
  content?: string
  slug: string
  block_type: 'text' | 'image' | 'video' | 'code' | 'link' | 'embedded' | 'callout' | 'table'
  is_published: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  created_by_id?: string
  metadata?: Record<string, any>
  language?: string
  tags?: string[]
}

export interface BlockCreate {
  title: string
  content?: string
  slug: string
  block_type?: 'text' | 'image' | 'video' | 'code' | 'link' | 'embedded' | 'callout' | 'table'
  metadata?: Record<string, any>
  language?: string
  tags?: string[]
}

export interface BlockUpdate {
  title?: string
  content?: string
  metadata?: Record<string, any>
}

export interface SuggestionCreate {
  title: string
  content?: string
  change_summary: string
}

export interface SuggestionResponse {
  id: string
  block_id: string
  title: string
  content?: string
  change_summary: string
  status: string
  created_at: string
  updated_at: string
  created_by_id?: string
}

export interface PathPublic {
  id: string
  title: string
  slug: string
  blocks: BlockPublic[]
  is_published: boolean
  created_at: string
  updated_at: string
  created_by_id?: string
  metadata?: Record<string, any>
  language?: string
  tags?: string[]
}

export interface PathCreate {
  title: string
  slug: string
  block_ids: string[]
  metadata?: Record<string, any>
  language?: string
  tags?: string[]
}

export interface SearchHit {
  id: string
  title: string
  slug: string
  level: string
  snippet?: string
}

export interface SearchResponse {
  query: string
  limit: number
  offset: number
  total: number
  hits: SearchHit[]
}

// AI Types
export interface AIConfiguration {
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

export interface AIConfigurationCreate {
  name: string
  description?: string
  provider: 'openai' | 'anthropic' | 'custom'
  agent_type: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
  model_name: string
  api_key?: string
  api_endpoint?: string
  temperature?: number
  max_tokens?: number
  system_prompt?: string
  mcp_enabled?: boolean
  mcp_server_url?: string
  can_create_blocks?: boolean
  can_edit_blocks?: boolean
  can_search_web?: boolean
  daily_request_limit?: number
}

export interface AIJob {
  id: string
  configuration_id: string
  job_type: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input_prompt: string
  output_data?: any
  suggested_blocks?: string[]
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
}

export interface AIJobCreate {
  configuration_id: string
  job_type: 'content_creator' | 'content_researcher' | 'content_editor' | 'course_designer'
  input_prompt: string
  input_metadata?: Record<string, any>
}

export interface AIBlockSuggestion {
  id: string
  ai_job_id: string
  title: string
  slug: string
  content: string
  block_type: string
  language?: string
  tags?: string[]
  source_urls?: string[]
  confidence_score: number
  ai_rationale?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
