# AI Agent Configuration Improvements

## Overview
This document describes the improvements made to the AI agent configuration system to fix agent creation failures, add support for custom OpenAPI-compatible endpoints, add MCP capability detection, and enable AI-assisted path creation.

## Changes Made

### 1. Fixed Agent Creation Issues
**Problem:** Agent creation was failing due to missing validation and unclear provider support.

**Solution:**
- Added better validation for custom providers
- Enhanced form with clearer instructions for each provider type
- Added helpful text for OpenAPI-compatible endpoints (Ollama, LM Studio, vLLM, LocalAI, etc.)

### 2. Added MCP Capability Detection
**Problem:** The system assumed all providers supported MCP, which is not true (e.g., OpenAI doesn't natively support MCP).

**Solution:**
- Added `mcp_capable` field to `AIConfiguration` model (backend)
- Added `mcp_capable` field to form and types (frontend)
- Added auto-detection logic based on provider:
  - **OpenAI**: Not MCP capable (noted in UI)
  - **Anthropic/Claude**: MCP capable by default
  - **Custom**: User specifies capability
- MCP integration options are now disabled unless the model is MCP-capable
- Added informative descriptions for each provider type

**Database Schema Change:**
```sql
ALTER TABLE ai_configurations ADD COLUMN mcp_capable BOOLEAN DEFAULT 0 NOT NULL;
```

### 3. Support for Custom OpenAPI-Compatible Endpoints
**Enhancement:** The system now explicitly supports any OpenAPI-compatible endpoint.

**What Works:**
- OpenAI (official API)
- Anthropic/Claude (official API)
- **Custom endpoints:**
  - Ollama (local LLM server)
  - LM Studio (local model runner)
  - vLLM (optimized inference server)
  - LocalAI (OpenAI-compatible local API)
  - Any other custom OpenAPI-compatible deployment

**Configuration:**
1. Select "Custom" as provider
2. Enter your API endpoint URL
3. Optionally provide API key if required
4. Specify if your model supports MCP protocol
5. Configure temperature, tokens, and other settings

### 4. AI-Assisted Path Creation
**Feature:** New page for creating learning paths with AI assistance.

**Location:** `/paths/create-with-ai`

**How It Works:**
1. User describes the learning path they want to create
2. AI (using `course_designer` agent type) suggests:
   - Path title and description
   - Multiple content blocks with titles, slugs, and content
   - Rationale for each block's inclusion
   - Proper ordering and structure
3. User can:
   - Review and edit path details
   - Reorder blocks via drag-and-drop
   - Remove unwanted blocks
   - Edit individual block details
4. Single-click creation of the complete path with all blocks

**UI Enhancements:**
- Added "Create with AI" button on paths listing page
- Available to users with `use_ai_agents` permission
- Shows alongside regular "Create Path" button

## File Changes

### Backend Changes
1. **`apps/api/src/ai_config_models.py`**
   - Added `mcp_capable` field to `AIConfiguration` model

2. **`apps/api/src/routers/ai_config.py`**
   - Added `mcp_capable` to `AIConfigCreate` schema
   - Updated configuration creation to include MCP capability

3. **`apps/api/alembic/versions/003_add_mcp_capable_field.py`**
   - Migration to add `mcp_capable` field

4. **Database Schema**
   - Created AI tables if they didn't exist
   - Added `mcp_capable` field to `ai_configurations` table

### Frontend Changes
1. **`apps/web/src/types/api.ts`**
   - Added `mcp_capable` field to type definitions

2. **`apps/web/src/components/AIConfigForm.tsx`**
   - Added MCP capability checkbox
   - Added provider-specific descriptions
   - Enhanced custom endpoint field with examples
   - Added logic to enable/disable MCP options based on capability
   - Auto-enable MCP when model is marked as capable

3. **`apps/web/src/app/paths/create-with-ai/page.tsx`** *(NEW)*
   - Complete AI-assisted path creation page
   - Drag-and-drop block reordering
   - AI suggestion preview and editing
   - Integration with AIAssistant component
   - Batch block creation and path assembly

4. **`apps/web/src/app/paths/page.tsx`**
   - Added "Create with AI" button
   - Conditional rendering based on `use_ai_agents` permission
   - Updated empty state to show both creation options

## Usage Examples

### Creating an Agent with Ollama
```
Provider: Custom
API Endpoint: http://localhost:11434/v1/completions
Model: llama2
MCP Capable: ☐ (Ollama doesn't support MCP natively)
MCP Enabled: ☐ (disabled since not capable)
```

### Creating an Agent with Claude (Anthropic)
```
Provider: Anthropic
Model: claude-3-sonnet-20240229
MCP Capable: ☑ (auto-detected)
MCP Enabled: ☑ (enabled by default)
MCP Server URL: http://localhost:8000
```

### Creating an Agent with OpenAI
```
Provider: OpenAI
Model: gpt-4
MCP Capable: ☐ (OpenAI doesn't support MCP natively)
MCP Enabled: ☐ (disabled since not capable)
Note: "OpenAI models do not natively support MCP"
```

### Creating a Learning Path with AI
1. Navigate to `/paths`
2. Click "Create with AI" button
3. Enter a prompt like:
   ```
   Create a comprehensive Python programming learning path 
   covering basics, intermediate concepts, and advanced topics
   ```
4. AI generates:
   - Path structure with title and description
   - 5-10 content blocks (chapters/lessons)
   - Logical ordering and progression
5. Review, reorder, or remove blocks
6. Click "Create Learning Path"

## Testing

### Test Agent Creation
```bash
curl -X POST http://localhost:8000/api/v1/ai/configurations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom LLM Agent",
    "provider": "custom",
    "agent_type": "content_creator",
    "model_name": "llama2",
    "api_endpoint": "http://localhost:11434/v1/completions",
    "mcp_capable": false,
    "mcp_enabled": false,
    "temperature": 0.7,
    "max_tokens": 2000
  }'
```

### Test Path Creation with AI
1. Create an AI agent with course_designer type
2. Navigate to `/paths/create-with-ai`
3. Enter a learning path description
4. Verify AI generates structured suggestions
5. Test drag-and-drop reordering
6. Create the path and verify all blocks are created

## Migration Instructions

### For Existing Installations
```bash
# Navigate to API directory
cd apps/api

# Run database migration (or schema was already applied)
python3 -m alembic upgrade head

# Verify tables exist
sqlite3 notimetolie.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ai_%';"

# Verify mcp_capable field exists
sqlite3 notimetolie.db "PRAGMA table_info(ai_configurations);" | grep mcp
```

### For New Installations
The schema is automatically created when initializing the database. No additional steps needed.

## Security Considerations

1. **API Keys:** All API keys are encrypted before storage using the encryption utility
2. **Custom Endpoints:** Users can specify any endpoint, but should only use trusted sources
3. **MCP Servers:** MCP server URLs should point to localhost or trusted internal services
4. **Permissions:** AI features require `use_ai_agents` permission

## Troubleshooting

### Agent Creation Fails
1. **Check provider configuration:**
   - OpenAI/Anthropic: Verify API key is valid
   - Custom: Ensure endpoint is accessible and OpenAPI-compatible

2. **Verify database schema:**
   ```bash
   sqlite3 notimetolie.db "PRAGMA table_info(ai_configurations);"
   ```
   Should show `mcp_capable` field

3. **Check logs:**
   ```bash
   # Backend logs
   tail -f apps/api/logs/app.log
   ```

### MCP Integration Not Working
1. Verify model is marked as MCP-capable
2. Check MCP server is running at specified URL
3. Ensure MCP integration is enabled in agent config
4. Review MCP server logs for connection issues

### AI Path Creation Not Appearing
1. Verify user has `use_ai_agents` permission
2. Check that at least one course_designer agent is configured
3. Clear browser cache and reload

## Future Enhancements

1. **Model Capability Auto-Detection:** Ping endpoint to detect MCP support automatically
2. **Batch Agent Creation:** Import multiple agent configurations
3. **Agent Templates:** Pre-configured templates for common use cases
4. **Path Templates:** AI-generated path templates for different learning goals
5. **Real-time Collaboration:** Multiple users collaborating on AI-generated paths
6. **Agent Performance Metrics:** Track token usage, response times, and success rates

## Support

For issues or questions:
1. Check this documentation
2. Review MCP server documentation at `/mcp`
3. Check API documentation at `/docs`
4. Review backend logs for error details

## Version History

- **2025-11-13:** Initial implementation
  - Added MCP capability detection
  - Fixed agent creation issues
  - Added AI-assisted path creation
  - Enhanced custom provider support
