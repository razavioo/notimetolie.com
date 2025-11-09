// Core types for the No Time To Lie project

export interface BaseNode {
  id: string;
  slug: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  status: 'draft' | 'published' | 'archived';
  metadata?: Record<string, any>;
}

export interface Block extends BaseNode {
  type: 'text' | 'image' | 'video' | 'code' | 'link' | 'embedded' | 'callout' | 'table';
  content: any;
  parent_id?: string;
  order_index: number;
  tags?: string[];
  revision_count: number;
  latest_revision_id?: string;
}

export interface Path extends BaseNode {
  type: 'path';
  blocks: PathBlock[];
  estimated_read_time?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
}

export interface PathBlock {
  block_id: string;
  order_index: number;
  is_optional?: boolean;
  prerequisites?: string[];
}

export interface Revision {
  id: string;
  node_id: string;
  content: any;
  created_at: string;
  created_by: string;
  change_summary: string;
  version: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: 'guest' | 'builder' | 'trusted_builder' | 'moderator' | 'admin';
  xp: number;
  level: number;
  badges: string[];
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  is_active: boolean;
}

export interface EditSuggestion {
  id: string;
  node_id: string;
  suggested_content: any;
  suggested_by: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  change_summary: string;
  review_comment?: string;
}

export interface UserFeedback {
  id: string;
  node_id: string;
  user_id: string;
  type: 'flag' | 'like' | 'bookmark' | 'helpful';
  comment?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SearchResult {
  id: string;
  type: 'block' | 'path';
  title: string;
  description?: string;
  content_snippet: string;
  relevance_score: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Event types for the event bus
export type AppEvent =
  | { type: 'BlockCreated'; payload: Block }
  | { type: 'BlockUpdated'; payload: Block }
  | { type: 'SuggestionSubmitted'; payload: EditSuggestion }
  | { type: 'FlagRaised'; payload: UserFeedback }
  | { type: 'UserLeveledUp'; payload: User }
  | { type: 'RevisionCreated'; payload: Revision };