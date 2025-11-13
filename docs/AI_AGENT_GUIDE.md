# AI Agent Configuration Guide

## Overview

The AI Agent system allows users with appropriate permissions to leverage AI assistants for content creation, research, and course design. The system uses Model Context Protocol (MCP) to provide AI agents with access to existing content and enable intelligent suggestions.

## Features

### 1. **AI Agent Configuration**
- Create multiple AI agent configurations with different purposes
- Support for multiple AI providers (OpenAI, Anthropic, Custom)
- Configurable parameters (temperature, max tokens, system prompts)
- MCP integration for context-aware assistance

### 2. **Agent Types**
- **Content Creator**: Generates new knowledge blocks from user prompts
- **Content Researcher**: Finds and suggests relevant resources
- **Content Editor**: Improves and refines existing content
- **Course Designer**: Creates structured learning paths

### 3. **MCP Integration**
AI agents use MCP to:
- Search existing blocks before creating new ones
- Suggest relevant existing content
- Understand context and avoid duplication
- Provide intelligent recommendations

### 4. **AI Job Management**
- Async job processing with status tracking
- Real-time progress updates
- Ability to cancel running jobs
- Full audit trail of AI operations

### 5. **Suggestion Workflow**
1. User creates AI job with prompt
2. AI searches existing content via MCP
3. AI generates suggestions with rationale
4. User reviews and approves/rejects suggestions
5. Approved suggestions become blocks

## API Endpoints

### Configuration Management
- `POST /v1/ai/configurations` - Create agent configuration
- `GET /v1/ai/configurations` - List user's configurations
- `PUT /v1/ai/configurations/{id}` - Update configuration
- `DELETE /v1/ai/configurations/{id}` - Delete configuration

### Job Management
- `POST /v1/ai/jobs` - Create new AI job
- `GET /v1/ai/jobs/{id}` - Get job status
- `POST /v1/ai/jobs/{id}/cancel` - Cancel running job
- `GET /v1/ai/jobs/{id}/suggestions` - List job suggestions

### Suggestion Management
- `POST /v1/ai/suggestions/{id}/approve` - Approve suggestion
- `POST /v1/ai/suggestions/{id}/reject` - Reject suggestion

## Permissions

Required permissions:
- `use_ai_agents` - Base permission to use AI features
- `create_blocks` - Required to approve AI suggestions

## Configuration Example

```json
{
  "name": "Content Creator Pro",
  "description": "GPT-4 powered content creator with web search",
  "provider": "openai",
  "agent_type": "content_creator",
  "model_name": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2000,
  "mcp_enabled": true,
  "can_create_blocks": true,
  "can_search_web": true,
  "daily_request_limit": 50
}
```

## Usage Flow

### Creating Content with AI

1. **Configure Agent**
   ```typescript
   // Create AI configuration
   POST /v1/ai/configurations
   ```

2. **Start AI Job**
   ```typescript
   POST /v1/ai/jobs
   {
     "configuration_id": "uuid",
     "job_type": "content_creator",
     "input_prompt": "Create a tutorial about Python async/await"
   }
   ```

3. **Monitor Progress**
   ```typescript
   GET /v1/ai/jobs/{job_id}
   // Returns: { status: "running", ... }
   ```

4. **Review Suggestions**
   ```typescript
   GET /v1/ai/jobs/{job_id}/suggestions
   // Returns list of AI-generated block suggestions
   ```

5. **Approve/Reject**
   ```typescript
   POST /v1/ai/suggestions/{suggestion_id}/approve
   // Creates actual block from suggestion
   ```

## MCP Tools Available

### search_blocks
Searches existing knowledge blocks by query
```json
{
  "tool": "search_blocks",
  "parameters": {
    "query": "python async",
    "limit": 10
  }
}
```

### get_block_content
Retrieves full content of a specific block
```json
{
  "tool": "get_block_content",
  "parameters": {
    "block_id": "uuid"
  }
}
```

### discover_related
Finds related content for a topic
```json
{
  "tool": "discover_related",
  "parameters": {
    "topic": "web development",
    "max_results": 5
  }
}
```

## Security Considerations

1. **API Key Storage**: API keys are encrypted at rest
2. **Rate Limiting**: Daily request limits per configuration
3. **Permission Checks**: All operations require appropriate permissions
4. **Audit Trail**: All AI operations are logged
5. **User Approval**: AI cannot create content without user approval

## File Storage with MinIO

AI agents can work with various content types:
- **Images**: Generated or sourced images
- **Videos**: Video content suggestions
- **Code**: Code snippets and examples
- **Documents**: PDF and document references

MinIO configuration (add to `.env`):
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=notimetolie
MINIO_SECURE=false
```

## Future Enhancements

- [ ] Real-time streaming of AI responses
- [ ] Multi-modal content generation (images, videos)
- [ ] Collaborative AI sessions
- [ ] AI-powered content quality scoring
- [ ] Automated content updates based on web changes
- [ ] Integration with external knowledge bases
