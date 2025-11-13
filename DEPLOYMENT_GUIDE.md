# Deployment Guide - No Time To Lie

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- Git

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd notimetolie.com

# Install frontend dependencies
npm install

# Install backend dependencies
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env

# Edit .env with your configuration
nano apps/api/.env
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/notimetolie

# Security
SECRET_KEY=your-secret-key-min-32-chars

# MinIO Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=notimetolie

# AI Providers (Optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start Infrastructure Services

```bash
# Start MinIO
docker-compose -f docker-compose.minio.yml up -d

# Verify MinIO is running
curl http://localhost:9000/minio/health/live
```

### 4. Database Setup

```bash
cd apps/api

# Run migrations
alembic upgrade head

# Verify migration
alembic current
```

### 5. Start Application

**Option A: Development Mode**

Terminal 1 - API:
```bash
cd apps/api
source .venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 - Web:
```bash
cd apps/web
npm run dev
```

**Option B: Production Mode**

```bash
# Build frontend
cd apps/web
npm run build

# Start with PM2 or systemd
cd apps/api
source .venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Verify Deployment

```bash
# Run verification script
./verify_deployment.sh

# Or manual checks
curl http://localhost:8000/v1/health
curl http://localhost:3000
```

## Service URLs

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Web**: http://localhost:3000
- **MinIO Console**: http://localhost:9001

## Database Migrations

### Create New Migration

```bash
cd apps/api
source .venv/bin/activate

# Auto-generate migration
alembic revision --autogenerate -m "description"

# Review generated file
cat alembic/versions/XXX_description.py

# Apply migration
alembic upgrade head
```

### Rollback Migration

```bash
# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision>
```

## MinIO Setup

### Access MinIO Console

1. Open http://localhost:9001
2. Login with minioadmin/minioadmin
3. Create bucket "notimetolie" (auto-created by docker-compose)
4. Set bucket policy to public-read for uploads folder

### Upload Files via CLI

```bash
# Install MinIO client
brew install minio/stable/mc  # macOS
# or
wget https://dl.min.io/client/mc/release/linux-amd64/mc

# Configure client
mc alias set local http://localhost:9000 minioadmin minioadmin

# Upload file
mc cp file.jpg local/notimetolie/uploads/
```

## AI Agent Configuration

### Using OpenAI

1. Get API key from https://platform.openai.com
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Or configure per agent in UI

### Using Anthropic

1. Get API key from https://console.anthropic.com
2. Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`
3. Or configure per agent in UI

### Using Custom Provider

1. Set up your LLM API endpoint
2. Configure in agent: provider="custom", api_endpoint="https://..."
3. Implement compatible API interface

## Monitoring & Logs

### Application Logs

```bash
# API logs
tail -f apps/api/logs/app.log

# Or with uvicorn
uvicorn src.main:app --log-level debug
```

### Database Logs

```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log
```

### MinIO Logs

```bash
# Docker logs
docker logs notimetolie-minio -f
```

## Performance Tuning

### API Workers

```bash
# Production with 4 workers
uvicorn src.main:app --workers 4 --host 0.0.0.0 --port 8000

# Calculate optimal workers: (2 x CPU cores) + 1
```

### Database Connection Pool

Edit `apps/api/src/config.py`:
```python
pool_size=10,
max_overflow=20,
pool_pre_ping=True
```

### Caching

```bash
# Install Redis
docker run -d -p 6379:6379 redis:latest

# Configure in .env
REDIS_URL=redis://localhost:6379
```

## Security Checklist

- [ ] Change SECRET_KEY from default
- [ ] Set strong MinIO credentials
- [ ] Use HTTPS in production
- [ ] Enable CORS only for your domains
- [ ] Rotate API keys regularly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular backups of database
- [ ] Monitor error logs

## Backup & Restore

### Database Backup

```bash
# Backup
pg_dump -U username notimetolie > backup_$(date +%Y%m%d).sql

# Restore
psql -U username notimetolie < backup_20251113.sql
```

### MinIO Backup

```bash
# Backup bucket
mc mirror local/notimetolie /backup/minio/notimetolie

# Restore bucket
mc mirror /backup/minio/notimetolie local/notimetolie
```

## Troubleshooting

### API won't start

```bash
# Check Python version
python3 --version  # Should be 3.12+

# Check dependencies
pip list | grep fastapi

# Check database connection
psql -U username -d notimetolie -c "SELECT 1"
```

### MinIO connection errors

```bash
# Check MinIO status
docker ps | grep minio

# Restart MinIO
docker-compose -f docker-compose.minio.yml restart

# Check logs
docker logs notimetolie-minio
```

### Database migration errors

```bash
# Check current version
alembic current

# Check pending migrations
alembic history

# Force version (dangerous!)
alembic stamp head
```

### AI jobs not processing

```bash
# Check API logs for errors
tail -f apps/api/logs/app.log | grep "AI"

# Verify API keys
python3 -c "import os; print(os.getenv('OPENAI_API_KEY')[:10])"

# Test AI provider connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Production Deployment

### Using Nginx

```nginx
server {
    listen 80;
    server_name notimetolie.com;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Using Docker

```bash
# Build images
docker build -t notimetolie-api -f apps/api/Dockerfile .
docker build -t notimetolie-web -f apps/web/Dockerfile .

# Run containers
docker-compose up -d
```

### Using Kubernetes

```bash
# Apply configurations
kubectl apply -f infrastructure/k8s/

# Check status
kubectl get pods -n notimetolie
```

## Health Checks

### API Health

```bash
curl http://localhost:8000/v1/health
# Expected: {"status":"ok"}
```

### Database Health

```bash
psql -U username -d notimetolie -c "SELECT COUNT(*) FROM content_nodes"
```

### MinIO Health

```bash
curl http://localhost:9000/minio/health/live
# Expected: 200 OK
```

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: `docs/`
- API Docs: http://localhost:8000/docs
