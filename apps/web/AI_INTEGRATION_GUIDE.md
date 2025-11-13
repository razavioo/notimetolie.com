# AI Integration Guide - Frontend

## Overview

This guide covers the complete AI-assisted content creation integration in the Next.js web application. The system provides a seamless workflow for users to leverage AI agents to generate high-quality content with Model Context Protocol (MCP) integration.

## Features Implemented

### 1. AI Configuration Management (`/ai-config`)

**Page:** `/app/ai-config/page.tsx`  
**Component:** `/components/AIConfigForm.tsx`

The AI configuration page allows users to:
- Create and manage multiple AI agents
- Configure provider settings (OpenAI, Anthropic, Custom)
- Set agent types (Content Creator, Researcher, Editor, Course Designer)
- Control MCP integration and permissions
- Monitor active AI jobs in real-time
- View WebSocket connection status

**Key Features:**
- ✅ Real-time job monitoring with WebSocket
- ✅ Progress tracking with visual indicators
- ✅ Agent configuration CRUD operations
- ✅ Live/Offline status indicator
- ✅ Encrypted API key storage

### 2. AI Assistant Component

**Component:** `/components/AIAssistant.tsx`

A reusable modal component that provides AI-powered content generation:

```tsx
import { AIAssistant } from '@/components/AIAssistant'

<AIAssistant
  onSuggestionAccepted={(suggestion) => {
    // Handle accepted suggestion
    console.log(suggestion)
  }}
  defaultPrompt="Create a tutorial about..."
  agentType="content_creator"
/>
```

**Features:**
- Agent selection dropdown
- Prompt input with context
- Real-time progress tracking
- Multiple suggestions review
- Confidence scores and rationale
- Source URL display
- One-click suggestion acceptance

### 3. AI-Powered Block Creation

**Page:** `/app/blocks/create-with-ai/page.tsx`

Dedicated page for creating blocks with AI assistance:

**Workflow:**
1. User opens AI Assistant
2. Selects an AI agent configuration
3. Enters content prompt
4. AI generates suggestions with MCP context
5. Reviews suggestions with metadata
6. Accepts suggestion → pre-fills BlockForm
7. Customizes and publishes

**Features:**
- ✅ Seamless suggestion → form flow
- ✅ Pre-filled form data from AI
- ✅ "Try Another" option to regenerate
- ✅ Full content editing before publish
- ✅ Automatic AI suggestion approval

### 4. Enhanced Block Creation Page

**Location:** `/app/blocks/page.tsx`

Added "Use AI Assistant" button to the blocks listing page for quick access to AI-powered creation.

### 5. Navigation Integration

**Component:** `/components/Navigation.tsx`

Added "AI Agents" navigation link with:
- Permission-based visibility (`use_ai_agents`)
- Role-based access control
- Visible to: Builder, Trusted Builder, Moderator, Admin

## API Client Integration

**File:** `/lib/api.ts`

Added AI-specific API methods:

```typescript
// Configuration Management
api.listAIConfigurations()
api.createAIConfiguration(data)
api.getAIConfiguration(id)
api.updateAIConfiguration(id, data)
api.deleteAIConfiguration(id)

// Job Management
api.createAIJob(data)
api.getAIJob(jobId)
api.cancelAIJob(jobId)
api.listAIJobSuggestions(jobId)

// Suggestion Management
api.approveAISuggestion(suggestionId)
api.rejectAISuggestion(suggestionId, feedback)
```

## Type Definitions

**File:** `/types/api.ts`

Added comprehensive TypeScript types:

```typescript
interface AIConfiguration {
  id: string
  name: string
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

interface AIBlockSuggestion {
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
```

## WebSocket Integration

**Hook:** `/hooks/useWebSocket.ts`

Real-time updates for AI job progress:

```typescript
import { useAIJobUpdates } from '@/hooks/useWebSocket'

const { isConnected } = useAIJobUpdates((update) => {
  if (update.type === 'ai_job_update') {
    // Handle job status change
    console.log('Job status:', update.status)
  } else if (update.type === 'ai_job_progress') {
    // Handle progress update
    console.log('Progress:', update.progress, update.message)
  }
})
```

**Features:**
- Automatic reconnection (up to 5 attempts)
- Heartbeat ping every 30 seconds
- Job-specific updates
- Progress percentage and messages
- Connection status indicator

## Permission System

**Hook:** `/hooks/useAuth.ts`

Updated permission system to include AI permissions:

```typescript
const rolePermissions = {
  admin: ['*'], // All permissions
  moderator: ['use_ai_agents', ...other permissions],
  trusted_builder: ['use_ai_agents', ...other permissions],
  builder: ['use_ai_agents', 'create_blocks', 'create_paths'],
  guest: ['view']
}
```

**Usage:**
```typescript
const { hasPermission } = useAuth()

if (hasPermission('use_ai_agents')) {
  // Show AI features
}
```

## User Experience Flow

### Creating Content with AI

1. **Navigate to AI Agents** (`/ai-config`)
   - View existing AI agents
   - Create new agent if needed
   - Configure provider and model settings

2. **Create Content** (`/blocks/create-with-ai`)
   - Click "Use AI Assistant"
   - Select AI agent from dropdown
   - Enter detailed prompt
   - Click "Generate with AI"

3. **Monitor Progress**
   - Real-time status updates via WebSocket
   - Progress bar with descriptive messages
   - Cancel option if needed

4. **Review Suggestions**
   - View AI-generated content
   - Check confidence scores
   - Review AI rationale
   - Verify source URLs
   - Compare multiple suggestions

5. **Accept & Customize**
   - Click "Use This Content"
   - Form pre-filled with suggestion data
   - Customize title, slug, content
   - Add/edit tags and metadata
   - Preview before publishing

6. **Publish**
   - Submit form to create block
   - AI suggestion automatically approved
   - Redirected to created block

## Styling & UI

### Components Used

- **shadcn/ui components:**
  - `Card`, `CardHeader`, `CardContent`, `CardDescription`, `CardTitle`
  - `Button` with variants (default, outline, ghost)
  - Form inputs and selects

- **Icons (lucide-react):**
  - `Sparkles` - AI features
  - `Settings` - Configuration
  - `Play` - Start job
  - `X` - Cancel/Close
  - `Wifi`, `WifiOff` - Connection status
  - `Loader2` - Loading spinner
  - `CheckCircle` - Success
  - `AlertCircle` - Warning
  - `BookOpen` - Sources

### Responsive Design

All AI components are fully responsive:
- Mobile: Stacked layouts, full-width modals
- Tablet: 2-column grids for config cards
- Desktop: 3-column grids, side-by-side layouts

### Dark Mode Support

All components support dark mode:
- Proper color contrast
- Dark mode specific styles using Tailwind's `dark:` prefix
- Muted colors for secondary information

## Environment Variables

Required environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# API will handle these, but can be overridden per configuration:
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Best Practices

### 1. Error Handling

Always handle API errors gracefully:

```typescript
const { data, error } = await api.createAIJob(jobData)

if (error) {
  // Show user-friendly error message
  alert(`Error: ${error}`)
  return
}

// Process data
```

### 2. Loading States

Provide feedback during async operations:

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  try {
    await api.createAIConfiguration(data)
  } finally {
    setIsLoading(false)
  }
}
```

### 3. WebSocket Cleanup

Properly cleanup WebSocket connections:

```typescript
useEffect(() => {
  // Connect
  const { disconnect } = useWebSocket(url, options)
  
  // Cleanup on unmount
  return () => disconnect()
}, [])
```

### 4. Form Validation

Validate user input before API calls:

```typescript
if (!prompt.trim() || !selectedConfig) {
  alert('Please fill in all required fields')
  return
}
```

## Testing

### Manual Testing Checklist

- [ ] Create AI configuration
- [ ] List all configurations
- [ ] Start AI job
- [ ] Monitor real-time progress
- [ ] Cancel running job
- [ ] Review suggestions
- [ ] Accept suggestion
- [ ] Create block from suggestion
- [ ] Verify block created successfully
- [ ] Check WebSocket reconnection
- [ ] Test permission-based access
- [ ] Verify dark mode styling
- [ ] Test mobile responsiveness

### Integration Testing

```bash
# Start API server
cd apps/api
source .venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Start web app
cd apps/web
npm run dev

# Open browser
open http://localhost:3000/ai-config
```

## Troubleshooting

### WebSocket Not Connecting

1. Check API server is running
2. Verify WebSocket endpoint: `ws://localhost:8000/ws`
3. Check browser console for errors
4. Verify auth token in localStorage

### AI Job Stuck in "Pending"

1. Check API server logs
2. Verify AI provider API keys
3. Check job processor is running
4. Verify database connection

### Suggestions Not Loading

1. Check job completed successfully
2. Verify `/v1/ai/jobs/{id}/suggestions` endpoint
3. Check browser network tab
4. Verify auth token

## Future Enhancements

- [ ] Batch job processing
- [ ] Job history and analytics
- [ ] Suggestion comparison view
- [ ] AI cost tracking per user
- [ ] Collaborative AI editing
- [ ] Path creation with AI
- [ ] AI-powered content improvement suggestions
- [ ] Multi-language content generation
- [ ] Custom AI model fine-tuning interface

## Resources

- **API Documentation**: http://localhost:8000/docs
- **Backend Implementation**: `/apps/api/AI_IMPLEMENTATION_SUMMARY.md`
- **Component Library**: https://ui.shadcn.com/
- **Icon Library**: https://lucide.dev/icons/

## Support

For issues or questions:
1. Check API logs: `apps/api/logs/`
2. Check browser console
3. Review backend implementation summary
4. Check WebSocket connection status

---

**Last Updated:** November 14, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
