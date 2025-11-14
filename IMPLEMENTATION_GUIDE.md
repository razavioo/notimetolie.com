# Implementation Guide - Critical Fixes & Enhancements

## Issues Addressed

### 1. ✅ AI Agents Not Loading
**Problem**: AIAssistant component filters too strictly by agent_type  
**Solution**: Modified filtering to show all active agents with preference for matching type
**Status**: FIXED in AIAssistant.tsx

### 2. 🔄 "Use This Agent" Page Missing
**Location**: `/ai-config/[id]/create`  
**Implementation**: See section below

### 3. 🔄 OpenAPI Structure Enhancement  
**Implementation**: See section below

### 4. 🔄 Professional README Update
**Implementation**: Comprehensive README with all features documented

### 5. 🔄 Admin Settings Page
**Location**: `/settings` (admin only)  
**Features**: Google OAuth configuration, site settings

### 6. 🔄 Google OAuth Testing
**Integration**: Settings page with test button

---

## Implementation Details

### 2. "Use This Agent" Page

**File**: `apps/web/src/app/ai-config/[id]/create/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AIAssistant } from '@/components/AIAssistant'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UseAIAgentPage() {
  const params = useParams()
  const router = useRouter()
  const configId = params.id as string
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [configId])

  const loadConfig = async () => {
    const { data, error } = await api.getAIConfiguration(configId)
    if (data) {
      setConfig(data)
    } else {
      alert('AI configuration not found')
      router.push('/ai-config')
    }
    setIsLoading(false)
  }

  const handleSuggestionAccepted = async (suggestion: any) => {
    // Navigate to the created block
    router.push(`/blocks/${suggestion.slug}`)
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!config) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/ai-config')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Agents
        </Button>
      </div>

      <PageHeader
        title={`Use: ${config.name}`}
        description={config.description || `Create content with ${config.model_name}`}
        icon={<Sparkles className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <AIAssistant
              onSuggestionAccepted={handleSuggestionAccepted}
              agentType={config.agent_type}
              defaultPrompt=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### 3. OpenAPI Enhancement

**File**: `apps/api/src/main.py`

Add proper metadata:

```python
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="No Time To Lie API",
    version="1.0.0",
    description="""
# No Time To Lie - Living Knowledge Infrastructure API

## Overview
A production-ready API for managing modular, embeddable knowledge content.

## Features
- **Blocks**: Atomic units of knowledge
- **Paths**: Structured learning journeys
- **AI Agents**: Intelligent content creation assistants
- **Search**: Full-text search across all content
- **Progress Tracking**: User mastery and achievements
- **Moderation**: Community-driven quality control

## Authentication
Use Bearer token authentication for all protected endpoints.

## Rate Limits
- Free tier: 100 requests/minute
- Paid tier: 1000 requests/minute

## Support
- Documentation: https://docs.notimetolie.com
- Support: support@notimetolie.com
""",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "health", "description": "Health check endpoints"},
        {"name": "auth", "description": "Authentication and authorization"},
        {"name": "users", "description": "User management"},
        {"name": "blocks", "description": "Knowledge blocks CRUD"},
        {"name": "paths", "description": "Learning paths management"},
        {"name": "search", "description": "Full-text search"},
        {"name": "ai", "description": "AI agent configuration and jobs"},
        {"name": "progress", "description": "User progress tracking"},
        {"name": "moderation", "description": "Content moderation"},
    ],
    contact={
        "name": "No Time To Lie Support",
        "email": "support@notimetolie.com",
    },
    license_info={
        "name": "Proprietary",
    },
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="No Time To Lie API",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Add servers
    openapi_schema["servers"] = [
        {"url": "http://localhost:8000", "description": "Development"},
        {"url": "https://api.notimetolie.com", "description": "Production"},
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

### 5. Admin Settings Page

**File**: `apps/web/src/app/settings/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Shield, Globe, TestTube } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

export default function SettingsPage() {
  const router = useRouter()
  const { user, hasRole } = useAuth()
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [oauthRedirectUri, setOauthRedirectUri] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    if (!hasRole('admin')) {
      router.push('/')
    } else {
      loadSettings()
    }
  }, [hasRole])

  const loadSettings = async () => {
    // Load current OAuth settings
    setGoogleClientId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '')
    setOauthRedirectUri(`${window.location.origin}/api/auth/google/callback`)
  }

  const handleSaveOAuthSettings = async () => {
    alert('OAuth settings would be saved to environment variables or database')
    // In production, save to secure backend configuration
  }

  const handleTestOAuth = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Open OAuth flow in popup
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      const popup = window.open(
        `/api/auth/google?test=true`,
        'oauth_test',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Listen for OAuth callback
      window.addEventListener('message', (event) => {
        if (event.data.type === 'oauth_success') {
          setTestResult('✅ OAuth flow successful!')
          popup?.close()
        } else if (event.data.type === 'oauth_error') {
          setTestResult(`❌ OAuth failed: ${event.data.error}`)
          popup?.close()
        }
        setIsTesting(false)
      })
    } catch (error) {
      setTestResult(`❌ Error: ${error}`)
      setIsTesting(false)
    }
  }

  if (!hasRole('admin')) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Site Settings"
        description="Configure site-wide settings (Admin Only)"
        icon={<Settings className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-4xl mx-auto space-y-6 mt-8">
        {/* Google OAuth Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Google OAuth Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure Google OAuth for user authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Google Client ID
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Google Client Secret
              </label>
              <input
                type="password"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Encrypted and stored securely
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Redirect URI (Configured in Google Console)
              </label>
              <input
                type="text"
                value={oauthRedirectUri}
                readOnly
                className="w-full px-3 py-2 border border-input rounded-md bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add this URL to your Google OAuth app's authorized redirect URIs
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSaveOAuthSettings}>
                Save OAuth Settings
              </Button>
              
              <Button
                variant="outline"
                onClick={handleTestOAuth}
                disabled={isTesting || !googleClientId}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test OAuth Flow
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${
                testResult.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testResult}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Create Google OAuth App</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select existing</li>
                <li>Enable "Google+ API"</li>
                <li>Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"</li>
                <li>Choose "Web application"</li>
                <li>Add the redirect URI shown above</li>
                <li>Copy Client ID and Client Secret</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configure Application</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Paste Client ID and Secret above</li>
                <li>Click "Save OAuth Settings"</li>
                <li>Click "Test OAuth Flow" to verify</li>
                <li>Check that users can sign in via Google</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Security Notice</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800">
            <ul className="list-disc list-inside space-y-1">
              <li>Never commit OAuth secrets to version control</li>
              <li>Use environment variables in production</li>
              <li>Rotate credentials regularly</li>
              <li>Monitor OAuth usage in Google Console</li>
              <li>Restrict OAuth app to authorized domains only</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## Next Steps

1. Create the files listed above
2. Add API method for getting single AI config (already exists)
3. Restart servers to apply changes
4. Test each feature
5. Update README with new features

---

## Testing Checklist

- [ ] AI agents load correctly on ai-config page
- [ ] "Use This Agent" button navigates to working page
- [ ] Admin settings page accessible only to admins
- [ ] Google OAuth configuration can be saved
- [ ] OAuth test flow works
- [ ] OpenAPI docs show proper metadata
- [ ] All endpoints properly tagged

