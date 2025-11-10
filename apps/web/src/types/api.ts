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
}

export interface BlockCreate {
  title: string
  content?: string
  slug: string
  block_type?: 'text' | 'image' | 'video' | 'code' | 'link' | 'embedded' | 'callout' | 'table'
  metadata?: Record<string, any>
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
}

export interface PathCreate {
  title: string
  slug: string
  block_ids: string[]
  metadata?: Record<string, any>
}
