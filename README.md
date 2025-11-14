# No Time To Lie

> **A Living Knowledge Infrastructure for the Modern World**

[![API Status](https://img.shields.io/badge/API-v1.0.0-blue.svg)](http://localhost:8000/docs)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.12+-green.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/next.js-14+-black.svg)](https://nextjs.org)

Create, organize, and share modular knowledge with powerful AI-assisted tools designed for collaboration, quality, and perpetual accuracy.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [AI-Assisted Content Creation](#ai-assisted-content-creation)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**No Time To Lie** is a Living Knowledge Infrastructure platform that delivers verifiable, factual knowledge in a modular, perpetually up-to-date, and embeddable format. We serve as the **Single Source of Truth (SSoT)** for procedural "How-To" guides and factual knowledge.

### Mission

To create a knowledge ecosystem where:
- Every piece of information is traceable and verifiable
- Content evolves in sync with real-world changes
- Users get complete answers without jumping between multiple conflicting sources
- Businesses can embed production-ready content without maintenance overhead

### Value Propositions

**For End-Users (B2C):**
- 🎯 **Guaranteed Accuracy**: Every piece of information is traceable and verifiable
- 🔄 **Continuous Updates**: Content evolves in real-time
- 🎨 **Seamless Experience**: Complete answers without source hopping

**For Businesses (B2B):**
- 📦 **Content-as-a-Service**: Embeddable content via API or SDK
- 🚀 **Zero Maintenance**: No in-house content team needed
- ⚡ **99.9% Uptime SLA**: Production-grade reliability

---

## Key Features

### 🧱 Modular Content Architecture
- **Blocks**: Atomic, reusable units of knowledge with unique URLs
- **Paths**: Ordered collections forming complete learning journeys
- **Rich Editor**: BlockNote-powered WYSIWYG with code syntax highlighting
- **Transclusion**: Embed blocks within other content

### 🤖 AI-Powered Content Creation
- **Multiple AI Agents**: OpenAI, Anthropic, or custom API support
- **Model Context Protocol (MCP)**: Context-aware content generation
- **Agent Types**: Content Creator, Researcher, Editor, Course Designer
- **Smart Suggestions**: AI searches existing content to avoid duplication
- **Quality Control**: Human review required for all AI-generated content

### 🔍 Advanced Search & Discovery
- **Full-text Search**: Powered by Meilisearch
- **Semantic Search**: Find related content intelligently
- **Faceted Filtering**: By tags, difficulty, language, type
- **Real-time Indexing**: Instant search updates

### 📊 Progress Tracking & Gamification
- **Mastery System**: Mark blocks and paths as mastered
- **Progress Dashboard**: Visual learning journey tracking
- **XP & Levels**: Earn experience through contributions
- **Badges**: Unlock achievements and recognition

### 🛡️ Quality Assurance
- **Pre-moderation**: New content requires approval
- **Edit Suggestions**: Git-style pull request workflow
- **Community Flags**: Report issues or outdated content
- **Revision History**: Complete audit trail
- **Trusted Builder System**: Earn autonomy through contributions

### 🔐 Authentication & Authorization
- **Email/Password**: Traditional authentication
- **Google OAuth**: One-click social login
- **RBAC + ABAC**: Hybrid permission system
- **Roles**: Guest, Builder, Trusted Builder, Moderator, Admin

### ⚙️ Admin Configuration
- **Settings Dashboard**: Site-wide configuration (admin only)
- **OAuth Management**: Configure Google OAuth with testing
- **Analytics**: User activity and content metrics
- **Moderation Queue**: Review flags and suggestions

---

## Quick Start

### Prerequisites

- **Python**: 3.12 or higher
- **Node.js**: 18 or higher with npm
- **Git**: 2.30+ (for version control)

### Verify Prerequisites

Before starting, verify your installation:

```bash
# Check Python version
python3 --version
# Should show: Python 3.12.x or higher

# Check Node.js version
node --version
# Should show: v18.x.x or higher

# Check npm
npm --version
# Should show: 9.x.x or higher

# Find paths (if commands not found)
which python3
which node
which npm
```

**Common Issues:**

If commands are not found:
```bash
# macOS - Find Node.js installation
find /usr/local -name "node" -type f 2>/dev/null
# Usually at: /usr/local/bin/node

# Add to PATH (if needed)
export PATH="/usr/local/bin:$PATH"

# Or create symbolic links
sudo ln -s /path/to/node /usr/local/bin/node
sudo ln -s /path/to/npm /usr/local/bin/npm
```

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd notimetolie.com

# 2. Install dependencies
npm install

# 3. Set up API
cd apps/api
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 5. Initialize database
alembic upgrade head

# 6. Set up web app
cd ../web
npm install
```

### Running the Application

**Development Mode (Recommended):**

```bash
# Terminal 1 - API Server
cd apps/api
source .venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Web App
cd apps/web
npm run dev
```

**Access Points:**
- **Web App**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **ReDoc**: http://localhost:8000/redoc (Alternative documentation)

**Docker Compose (Production-like):**

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Blocks     │  │    Paths     │  │  AI Agents   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (FastAPI)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │   Content    │  │   AI Jobs    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  PostgreSQL  │ │ Meilisearch  │ │    Redis     │
    │   (Primary)  │ │   (Search)   │ │ (Cache/Queue)│
    └──────────────┘ └──────────────┘ └──────────────┘
```

### Event-Driven Architecture

All inter-service communication uses an **Event Bus** for decoupling:

```python
# Example: Block created event
bus.publish(BlockCreated(
    block_id="123",
    title="Python Async/Await",
    user_id="user-456"
))

# Multiple listeners react:
# - Search Service: Updates Meilisearch index
# - Gamification Service: Awards XP to user
# - Notification Service: Notifies followers
# - Audit Service: Logs event
```

**Key Events:**
- `BlockCreated`, `BlockUpdated`, `BlockDeleted`
- `PathCreated`, `PathUpdated`, `PathDeleted`
- `SuggestionCreated`, `SuggestionApproved`, `SuggestionRejected`
- `FlagRaised`, `FlagResolved`
- `UserLeveledUp`, `BadgeEarned`

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.12+ | Programming language |
| **FastAPI** | 0.115+ | Web framework with async support |
| **SQLAlchemy** | 2.1+ | ORM with async engine |
| **Pydantic** | 2.8+ | Data validation |
| **Alembic** | 1.13+ | Database migrations |
| **PostgreSQL** | 15+ | Primary database (SQLite for dev) |
| **Meilisearch** | 1.9+ | Full-text search engine |
| **Redis** | 7.0+ | Caching and job queue |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14+ | React framework with App Router |
| **TypeScript** | 5.7+ | Type safety |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **BlockNote** | 0.15+ | Rich text editor |
| **shadcn/ui** | Latest | Component library |
| **Lucide Icons** | Latest | Icon system |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy & load balancer |
| **GitHub Actions** | CI/CD pipeline |

---

## Project Structure

```
notimetolie.com/
├── apps/
│   ├── api/                          # FastAPI backend
│   │   ├── src/
│   │   │   ├── main.py              # App entry point
│   │   │   ├── config.py            # Configuration management
│   │   │   ├── routers/             # API route handlers
│   │   │   │   ├── blocks.py        # Blocks CRUD
│   │   │   │   ├── paths.py         # Paths CRUD
│   │   │   │   ├── ai_config.py     # AI configuration
│   │   │   │   ├── auth.py          # Authentication
│   │   │   │   └── users.py         # User management
│   │   │   ├── models/              # SQLAlchemy models
│   │   │   │   ├── user.py
│   │   │   │   ├── content_node.py
│   │   │   │   └── ai_configuration.py
│   │   │   ├── services/            # Business logic
│   │   │   │   ├── ai_providers.py  # AI integrations
│   │   │   │   ├── search.py        # Meilisearch
│   │   │   │   └── auth.py          # Auth utilities
│   │   │   ├── events/              # Event bus
│   │   │   │   ├── bus.py           # Event dispatcher
│   │   │   │   ├── events.py        # Event definitions
│   │   │   │   └── listeners.py     # Event handlers
│   │   │   └── utils/               # Helpers
│   │   ├── alembic/                 # DB migrations
│   │   ├── tests/                   # API tests (59 tests)
│   │   ├── requirements.txt         # Python dependencies
│   │   └── .env                     # Environment config
│   │
│   └── web/                         # Next.js frontend
│       ├── src/
│       │   ├── app/                 # Next.js App Router
│       │   │   ├── page.tsx         # Homepage
│       │   │   ├── blocks/          # Blocks pages
│       │   │   ├── paths/           # Paths pages
│       │   │   ├── ai-config/       # AI management
│       │   │   │   ├── page.tsx     # Agent list
│       │   │   │   └── [id]/create/ # Use agent
│       │   │   └── settings/        # Admin settings
│       │   ├── components/          # React components
│       │   │   ├── ui/              # shadcn/ui components
│       │   │   ├── Navigation.tsx   # Main nav
│       │   │   ├── AIAssistant.tsx  # AI interface
│       │   │   └── BlockEditor.tsx  # Content editor
│       │   ├── lib/                 # Utilities
│       │   │   ├── api.ts           # API client
│       │   │   └── utils.ts         # Helpers
│       │   └── types/               # TypeScript types
│       ├── public/                  # Static assets
│       ├── package.json             # Dependencies
│       └── next.config.js           # Next.js config
│
├── docs/                            # Documentation
│   └── AI_AGENT_IMPROVEMENTS.md     # AI features guide
│
├── infrastructure/                  # DevOps
│   └── docker/                      # Docker configs
│
├── test_*.py                        # Integration tests
├── docker-compose.yml               # Local development
├── IMPLEMENTATION_GUIDE.md          # Feature implementation guide
├── package.json                     # Root workspace config
└── README.md                        # This file
```

---

## Core Concepts

### Blocks

The atomic unit of knowledge. Each block:
- ✅ Is self-contained and meaningful
- ✅ Has a unique URL (`/blocks/python-async-await`)
- ✅ Can be embedded in multiple paths
- ✅ Supports rich content (text, code, images, videos)
- ✅ Has revision history
- ✅ Can receive edit suggestions

**Example Block:**

```json
{
  "id": "uuid",
  "slug": "python-async-await",
  "title": "Python Async/Await Basics",
  "content": { /* BlockNote JSON */ },
  "tags": ["python", "async", "programming"],
  "difficulty": "beginner",
  "estimated_time_minutes": 15,
  "created_by": "user-id",
  "is_published": true
}
```

### Paths

An ordered collection of blocks forming a complete learning journey:
- ✅ Has prerequisite requirements
- ✅ Defines a logical learning sequence
- ✅ Can be forked and customized
- ✅ Tracks completion progress
- ✅ Has difficulty and time estimates

**Example Path:**

```json
{
  "id": "uuid",
  "slug": "learn-python-async",
  "title": "Master Python Async Programming",
  "description": "Complete guide to async/await in Python",
  "blocks": [
    {"block_id": "intro-to-async", "order": 0},
    {"block_id": "python-async-await", "order": 1},
    {"block_id": "asyncio-library", "order": 2}
  ],
  "difficulty": "intermediate",
  "estimated_time_minutes": 120
}
```

### Users & Roles

**Permission Hierarchy:**

1. **Guest** → Read public content
2. **Builder** → Create blocks (pre-moderation required)
3. **Trusted Builder** → Create blocks (auto-approved)
4. **Moderator** → Approve content, manage flags
5. **Admin** → Full system access, settings management

**Progression:**
- Earn **XP** through contributions
- Unlock **badges** for achievements
- Level up to gain more **permissions**

---

## AI-Assisted Content Creation

### Overview

AI agents serve as intelligent assistants that help builders create high-quality content faster while maintaining human oversight.

### Agent Types

| Type | Purpose | Capabilities |
|------|---------|-------------|
| **Content Creator** | Generate new blocks | Research topics, create drafts, find images |
| **Content Researcher** | Find resources | Search web, discover related blocks |
| **Content Editor** | Improve content | Enhance clarity, fix errors, optimize |
| **Course Designer** | Build paths | Select blocks, order logically, fill gaps |

### Workflow

```
1. Configure AI Agent
   └─> Choose provider (OpenAI, Anthropic, custom)
   └─> Set model parameters (temperature, max tokens)
   └─> Enable MCP for context awareness

2. Create Content Request
   └─> Provide detailed prompt
   └─> AI searches existing content (avoids duplication)
   └─> AI performs web research (if enabled)

3. Review AI Suggestions
   └─> AI generates structured draft
   └─> Includes sources and citations
   └─> Provides confidence scores

4. Human Approval
   └─> Review for accuracy
   └─> Make edits as needed
   └─> Approve to publish

5. Content Published
   └─> Block/Path created
   └─> Indexed for search
   └─> XP awarded to builder
```

### Model Context Protocol (MCP)

MCP enables AI agents to:
- 🔍 **Search existing content** before creating new blocks
- 📚 **Retrieve full context** of related blocks
- 🔗 **Discover connections** between topics
- 🎯 **Avoid duplication** by suggesting existing content

**Available MCP Tools:**
```python
# Search existing blocks
search_blocks(query="Python async", limit=10)

# Get block details
get_block_content(block_id="uuid")

# Find related content
discover_related(topic="async programming", max=5)

# List paths by category
list_paths(category="python")
```

### Configuration

**Navigate to**: http://localhost:3000/ai-config

**Create New Agent:**
1. Click "Create AI Agent"
2. Choose provider and model
3. Set agent type and parameters
4. Enable MCP and tools
5. Set daily request limit
6. Save configuration

**Use Agent:**
1. Go to AI Agents page
2. Click "Use this agent" on any agent
3. Enter your content prompt
4. Wait for AI to process
5. Review suggestions
6. Approve to create content

### Best Practices

✅ **Be Specific**: Provide detailed prompts with context  
✅ **Review Thoroughly**: Always verify accuracy  
✅ **Check Sources**: Validate all citations  
✅ **Use MCP**: Leverage existing content  
✅ **Iterate**: Reject and refine until quality meets standards  
✅ **Attribution**: Ensure proper attribution for sourced content  

### Rate Limits

- **Default**: 50 AI requests per day per agent
- **Configurable**: Adjust per agent
- **Admin Override**: Admins can set custom limits

---

## API Documentation

### Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.notimetolie.com`

### Authentication

All protected endpoints require a Bearer token:

```bash
# Login
curl -X POST http://localhost:8000/v1/users/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=yourpassword"

# Response
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}

# Use token in requests
curl http://localhost:8000/v1/blocks \
  -H "Authorization: Bearer eyJ..."
```

### Core Endpoints

#### Blocks

```bash
# List all blocks
GET /v1/blocks

# Get specific block
GET /v1/blocks/{slug}

# Create block
POST /v1/blocks
{
  "title": "New Block",
  "content": { /* BlockNote JSON */ },
  "tags": ["tag1", "tag2"]
}

# Update block
PUT /v1/blocks/{id}

# Delete block
DELETE /v1/blocks/{id}

# Mark as mastered
POST /v1/blocks/{id}/master
```

#### Paths

```bash
# List all paths
GET /v1/paths

# Get specific path
GET /v1/paths/{slug}

# Create path
POST /v1/paths
{
  "title": "New Path",
  "description": "Learning journey",
  "block_ids": ["block-1", "block-2"]
}

# Update path
PUT /v1/paths/{id}

# Delete path
DELETE /v1/paths/{id}
```

#### AI Agents

```bash
# List AI configurations
GET /v1/ai/configurations

# Get specific config
GET /v1/ai/configurations/{id}

# Create configuration
POST /v1/ai/configurations
{
  "name": "My Agent",
  "provider": "openai",
  "model_name": "gpt-4",
  "agent_type": "content_creator"
}

# Update configuration
PUT /v1/ai/configurations/{id}

# Delete configuration
DELETE /v1/ai/configurations/{id}

# Create AI job
POST /v1/ai/jobs
{
  "configuration_id": "config-id",
  "job_type": "content_creator",
  "input_prompt": "Create tutorial about..."
}

# Get job status
GET /v1/ai/jobs/{job_id}

# List job suggestions
GET /v1/ai/jobs/{job_id}/suggestions

# Approve suggestion
POST /v1/ai/suggestions/{suggestion_id}/approve

# Reject suggestion
POST /v1/ai/suggestions/{suggestion_id}/reject
```

#### Search

```bash
# Search blocks and paths
GET /v1/search?q=python async&limit=20

# Advanced search with filters
GET /v1/search?q=python&type=block&difficulty=beginner
```

### Interactive Documentation

Visit **http://localhost:8000/docs** for:
- 📖 Full API reference
- 🧪 Interactive testing (Swagger UI)
- 📝 Request/response schemas
- 🔐 Authorization testing

---

## Development

### Database Migrations

When modifying models:

```bash
cd apps/api
source .venv/bin/activate

# Create migration
alembic revision --autogenerate -m "Add new field"

# Review generated file
# apps/api/alembic/versions/xxx_add_new_field.py

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### Code Quality

**Backend (Python):**

```bash
cd apps/api
source .venv/bin/activate

# Format code
black src/

# Sort imports
isort src/

# Type checking (if configured)
mypy src/

# Linting
flake8 src/
```

**Frontend (TypeScript):**

```bash
cd apps/web

# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

### Environment Variables

**API** (`apps/api/.env`):

```env
# Database
DATABASE_URL=sqlite:///./notimetolie.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=http://localhost:3000

# Search
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=masterKey

# AI Providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Web** (`apps/web/.env.local`):

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

---

## Testing

### API Tests

```bash
cd apps/api
source .venv/bin/activate

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html --cov-report=term

# Run specific test file
pytest tests/test_blocks.py -v

# Run in parallel (faster)
pytest tests/ -n auto
```

**Test Coverage:**
- ✅ 59 tests covering:
  - Authentication and RBAC
  - Blocks CRUD operations
  - Paths CRUD operations
  - Search functionality
  - Content serialization (BlockNote)
  - Event bus system
  - Database models

### Integration Tests

```bash
# Test API endpoints
./test_api.sh

# Test AI agent creation
./test_agent_creation.py

# Test all features
./test_all_features.sh

# Verify deployment readiness
./verify_deployment.sh
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Google OAuth flow
- [ ] Create/edit/delete blocks
- [ ] Create/edit/delete paths
- [ ] Search functionality
- [ ] AI agent configuration
- [ ] AI content generation
- [ ] Mark blocks as mastered
- [ ] Admin settings page
- [ ] OAuth testing interface

---

## Troubleshooting

### Common Setup Issues

#### Issue 1: "npm: command not found"

**Cause:** Node.js/npm not in PATH or not installed

**Solution:**
```bash
# Find Node.js installation
which node
# If not found, locate it:
find /usr/local -name "node" -type f 2>/dev/null

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="/usr/local/bin:$PATH"

# Or use full path to run
/usr/local/bin/node node_modules/.bin/next dev -p 3000
```

#### Issue 2: "Python not found" or "Module not found"

**Cause:** Python not installed or virtual environment not activated

**Solution:**
```bash
# Verify Python installation
python3 --version

# Recreate virtual environment
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Issue 3: Port Already in Use

**Cause:** Previous server still running on port 8000 or 3000

**Solution:**
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or kill all
pkill -f "uvicorn src.main:app"
pkill -f "next-server"
```

#### Issue 4: Database Errors

**Cause:** Database migrations not run or corrupted database

**Solution:**
```bash
cd apps/api
source .venv/bin/activate

# Check current migration status
alembic current

# Run migrations
alembic upgrade head

# If corrupted, backup and reset
mv notimetolie.db notimetolie.db.backup
alembic upgrade head
```

#### Issue 5: "Module 'X' has no attribute 'Y'"

**Cause:** Dependency version mismatch or outdated packages

**Solution:**
```bash
# API dependencies
cd apps/api
source .venv/bin/activate
pip install --upgrade -r requirements.txt

# Web dependencies
cd apps/web
npm install
# If issues persist:
rm -rf node_modules package-lock.json
npm install
```

#### Issue 6: WebSocket Connection Failed

**Cause:** API server not running or CORS issues

**Solution:**
```bash
# Verify API server is running
curl http://localhost:8000/v1/health
# Should return: {"status":"ok"}

# Check CORS settings in apps/api/.env
CORS_ORIGINS=http://localhost:3000

# Restart API server
```

#### Issue 7: Google OAuth Not Working

**Cause:** Missing environment variables or incorrect configuration

**Solution:**
```bash
# Check environment variables
# In apps/web/.env.local:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id

# In apps/api/.env:
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Configure in Google Cloud Console:
# 1. Create OAuth 2.0 Client ID
# 2. Add redirect URI: http://localhost:3000/api/auth/google/callback
# 3. Copy Client ID and Secret to .env files
```

### Checking Server Status

```bash
# Check if servers are running
lsof -i :8000  # API server
lsof -i :3000  # Web server

# Check server health
curl http://localhost:8000/v1/health  # API
curl http://localhost:3000             # Web

# View logs (if running in background)
tail -f /tmp/api.log
tail -f /tmp/web.log
```

### Clean Start (Reset Everything)

If nothing works, try a complete reset:

```bash
# Stop all servers
pkill -f "uvicorn"
pkill -f "next"

# API cleanup
cd apps/api
rm -rf .venv __pycache__
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# Web cleanup
cd ../web
rm -rf node_modules .next
npm install

# Start fresh
# Terminal 1:
cd apps/api && source .venv/bin/activate && uvicorn src.main:app --reload

# Terminal 2:
cd apps/web && npm run dev
```

---

## Deployment

### Production Checklist

**Backend:**
- [ ] Set `DATABASE_URL` to PostgreSQL connection string
- [ ] Generate strong `SECRET_KEY` (32+ characters)
- [ ] Configure `CORS_ORIGINS` with production domain
- [ ] Set up Redis for caching and queues
- [ ] Deploy Meilisearch for search
- [ ] Enable HTTPS/SSL
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure error tracking (Sentry)
- [ ] Set up backups (daily PostgreSQL dumps)
- [ ] Review and set rate limits
- [ ] Configure AI provider API keys

**Frontend:**
- [ ] Set `NEXT_PUBLIC_API_URL` to production API
- [ ] Configure Google OAuth redirect URIs
- [ ] Enable analytics (Plausible, etc.)
- [ ] Optimize images and assets
- [ ] Enable CDN for static files
- [ ] Set up logging

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl https://api.notimetolie.com/v1/health
```

### Environment Configuration

**Production `.env` example:**

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/notimetolie

# Security (CRITICAL: Change these!)
SECRET_KEY=<generate-strong-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=https://notimetolie.com,https://www.notimetolie.com

# Search
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_KEY=<production-master-key>

# Redis
REDIS_URL=redis://redis:6379/0

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

---

## Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/notimetolie.com.git
   cd notimetolie.com
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow existing conventions
   - Add tests for new features

4. **Test**
   ```bash
   # Backend tests
   cd apps/api && pytest tests/
   
   # Frontend checks
   cd apps/web && npm run lint
   ```

5. **Commit**
   ```bash
   git add -A
   git commit -m "feat: add new feature description"
   ```

6. **Push & Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add AI agent configuration page
fix: resolve block editor save issue
docs: update API documentation
style: format code with black
refactor: simplify auth logic
test: add tests for path creation
chore: update dependencies
```

### Code Style

**Python:**
- Follow PEP 8
- Use type hints
- Format with Black
- Sort imports with isort
- Max line length: 100

**TypeScript:**
- Use TypeScript strict mode
- Prefer functional components
- Use Tailwind CSS for styling
- Format with Prettier
- Follow ESLint rules

---

## License

**Proprietary License**

Copyright (c) 2025 No Time To Lie

All rights reserved. This software and associated documentation files (the "Software") may not be used, copied, modified, merged, published, distributed, sublicensed, and/or sold without explicit permission from the copyright holder.

---

## Support & Contact

- **Website**: https://notimetolie.com
- **Documentation**: https://docs.notimetolie.com
- **API Status**: https://status.notimetolie.com
- **Email**: support@notimetolie.com
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/notimetolie.com/issues)

---

## Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework
- [BlockNote](https://www.blocknotejs.org/) - Rich text editor
- [Meilisearch](https://www.meilisearch.com/) - Search engine
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

**Made with ❤️ by the No Time To Lie team**
