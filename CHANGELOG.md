# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.0] - 2025-11-13

### Added

#### UI/UX Improvements
- **Clickable Cards**: Made block and path cards fully clickable for better navigation
  - Cards now navigate to detail pages on click
  - Action buttons properly handle event propagation
  - Added cursor pointer styling

- **Dark Theme Support**: Complete dark theme color fixes
  - Replaced hardcoded colors with semantic tokens
  - Fixed code blocks, modals, and form inputs
  - Improved contrast and readability
  - Updated API docs page colors

- **Copy Button Enhancement**: Visual feedback for copy operations
  - Checkmark icon appears on successful copy
  - "Copied!" text in green
  - Auto-fade after 2 seconds
  - Applied to all SharePanel copy buttons

- **Mobile Navigation**: Improved authentication UX
  - Hide sign-in button when authenticated
  - Show user profile and sign-out options
  - Display user role badges
  - Better mobile menu organization

#### Content Features
- **Checkpoint System**: "I know this..." button for content management
  - Collapsible/expandable block content
  - Chevron icons for state indication
  - Session-persistent state

- **Block Usage Display**: Shows paths using each block
  - Clickable path cards on block detail pages
  - Path metadata (block count, publish status)
  - Improved content discovery

- **Language Selection**: Multi-language support
  - 11 languages supported (EN, ES, FR, DE, IT, PT, RU, ZH, JA, KO, AR)
  - Language badges on cards
  - Language validation for paths

- **Tagging System**: Content organization with tags
  - Comma-separated tag input
  - Tag pills on cards (shows first 3, +count for more)
  - Search and filter by tags

- **Language Validation**: Path consistency checking
  - Validates all blocks in path have same language
  - Shows error messages for incompatible blocks
  - Prevents mixed-language paths
  - Displays language info in selection lists

#### Path Improvements
- **Better Path Display**: Redesigned path detail page
  - Rich block cards with numbered indicators
  - Block metadata (type, slug, preview)
  - Clickable navigation
  - Improved visual hierarchy

- **Path Card Simplification**: Block type summary
  - Shows count per block type (e.g., "3x text", "2x code")
  - Reduced visual clutter
  - Consistent card heights

#### AI Agent System (NEW)
- **AI Configuration Management**
  - Create multiple AI agent configurations
  - Support for OpenAI, Anthropic, and custom providers
  - Four agent types: content creator, researcher, editor, course designer
  - Configurable parameters (temperature, tokens, system prompts)
  - MCP (Model Context Protocol) integration

- **MCP Integration**
  - Search existing blocks before creating new ones
  - Discover related content intelligently
  - Provide full block context to AI agents
  - Avoid content duplication
  - Three MCP tools: search_blocks, get_block_content, discover_related

- **AI Job Management**
  - Async job processing with status tracking
  - Create, monitor, and cancel AI jobs
  - Real-time progress updates
  - Full execution audit trail

- **AI Suggestion Workflow**
  - AI generates block suggestions with rationale
  - User review and approval/rejection
  - Confidence scoring
  - Source URL tracking
  - Feedback collection

- **Frontend AI Interface**
  - AI configuration page with agent management
  - Active jobs monitoring dashboard
  - Visual status indicators (pending, running, completed, failed, cancelled)
  - Agent creation and editing forms

- **Security & Permissions**
  - Permission-based access (`use_ai_agents`, `create_blocks`)
  - Encrypted API key storage
  - Rate limiting per configuration
  - Daily request limits
  - User approval required for all AI-generated content

#### API Endpoints (AI)
- `POST /v1/ai/configurations` - Create agent configuration
- `GET /v1/ai/configurations` - List user's configurations
- `POST /v1/ai/jobs` - Create new AI job
- `GET /v1/ai/jobs/{id}` - Get job status
- `POST /v1/ai/jobs/{id}/cancel` - Cancel running job
- `GET /v1/ai/jobs/{id}/suggestions` - List job suggestions
- `POST /v1/ai/suggestions/{id}/approve` - Approve suggestion
- `POST /v1/ai/suggestions/{id}/reject` - Reject suggestion

#### Database Models (AI)
- `AIConfiguration` - Agent settings and preferences
- `AIJob` - Job execution tracking
- `AIBlockSuggestion` - AI-generated content awaiting approval

### Changed
- Updated TypeScript types to include language and tags fields
- Improved form submissions with new metadata fields
- Enhanced card components with language and tag displays

### Fixed
- Dark theme color inconsistencies across all components
- Event propagation issues in card action buttons
- Mobile navigation authentication display
- Search filter dropdown background colors

### Technical Debt
- TODO: Implement actual AI job processing (background tasks)
- TODO: Add MinIO file storage integration
- TODO: Add real-time streaming of AI responses
- TODO: Implement multi-modal content generation
- TODO: Add automated content quality scoring

## Commit History

### UI Features
1. `feat(ui): make blocks and paths cards clickable` - Navigation improvements
2. `fix(theme): improve dark theme colors across components` - Theme fixes
3. `feat(auth): improve mobile navigation with user status` - Mobile UX
4. `feat(paths): redesign path detail page with clickable block cards` - Path improvements
5. `feat(blocks): add 'I know this' checkpoint button and path usage` - Content features
6. `feat(content): add language selection and tagging system` - i18n and organization
7. `feat(paths): add language validation for path blocks` - Data consistency
8. `refactor(paths): simplify path card to show block type counts` - UI cleanup

### AI Features
9. `feat(ai): add AI agent configuration and MCP integration` - Complete AI system
10. `feat(infrastructure): add complete AI system implementation` - Full stack implementation

## [1.0.0] Release - 2025-11-13

### Complete Feature Set

This major release includes:
- ✅ Full UI/UX overhaul with dark theme
- ✅ Complete AI agent system with MCP
- ✅ MinIO file storage integration
- ✅ Language and tagging system
- ✅ Background job processing
- ✅ Encrypted API key storage
- ✅ Docker support for all services

## Migration Notes

### Database
New tables added:
- `ai_configurations`
- `ai_jobs`
- `ai_block_suggestions`

Migration required for:
- Adding `language` field to `content_nodes`
- Adding `tags` field to `content_nodes`

### Environment Variables
New optional variables:
```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=notimetolie
MINIO_SECURE=false
```

### Permissions
New permission required: `use_ai_agents`

### Dependencies
Install new Python packages:
```bash
cd apps/api
source .venv/bin/activate
pip install -r requirements.txt
```

New dependencies:
- minio==7.2.0 (MinIO storage)
- aiofiles==23.2.1 (Async file operations)
- openai==1.3.0 (OpenAI API)
- anthropic==0.7.0 (Claude API)
- cryptography==41.0.7 (Encryption)

### Docker Services
Start MinIO:
```bash
docker-compose -f docker-compose.minio.yml up -d
```

Access MinIO Console: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

## Documentation
- Added `docs/AI_AGENT_GUIDE.md` - Complete AI agent documentation
- Updated README with AI features section
