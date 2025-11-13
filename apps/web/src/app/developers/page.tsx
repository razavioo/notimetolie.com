'use client'

import { Code, Book, Zap, ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DevelopersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Developer Resources"
        description="Everything you need to integrate and extend No Time To Lie"
        icon={<Code className="h-8 w-8 text-primary" />}
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Documentation */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" />
                  API Documentation
                </CardTitle>
                <CardDescription className="mt-2">
                  RESTful API for blocks, paths, search, and AI-assisted content creation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Available Endpoints</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Content Management (Blocks & Paths)</li>
                <li>• Full-text Search with Meilisearch</li>
                <li>• Edit Suggestions & Moderation</li>
                <li>• AI Configuration & Job Management</li>
                <li>• User Progress Tracking</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• OpenAPI 3.0 Specification</li>
                <li>• Interactive Swagger UI</li>
                <li>• Authentication with JWT</li>
                <li>• WebSocket Support</li>
                <li>• Rate Limiting & Permissions</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href="/docs">
                <Button className="w-full flex items-center justify-center gap-2">
                  View API Docs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* MCP Integration */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Model Context Protocol
                </CardTitle>
                <CardDescription className="mt-2">
                  Context-aware AI integration for intelligent content generation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">MCP Capabilities</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Search existing blocks before creating</li>
                <li>• Context-aware content suggestions</li>
                <li>• Discover related content</li>
                <li>• Structured JSON-LD responses</li>
                <li>• Schema.org compatibility</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Integration</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Works with OpenAI & Anthropic</li>
                <li>• Custom model support</li>
                <li>• Automatic deduplication</li>
                <li>• Source URL tracking</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link href="/mcp">
                <Button className="w-full flex items-center justify-center gap-2">
                  Learn About MCP
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>
              Get started with the No Time To Lie API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <h4 className="font-medium">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Register an account and obtain your JWT token via the login endpoint
                </p>
                <code className="block text-xs bg-muted p-2 rounded mt-2">
                  POST /v1/users/login
                </code>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <h4 className="font-medium">Make Requests</h4>
                <p className="text-sm text-muted-foreground">
                  Use your token in the Authorization header to access protected endpoints
                </p>
                <code className="block text-xs bg-muted p-2 rounded mt-2">
                  Authorization: Bearer &lt;token&gt;
                </code>
              </div>

              {/* Step 3 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <h4 className="font-medium">Build</h4>
                <p className="text-sm text-muted-foreground">
                  Create blocks, paths, leverage AI, and build amazing knowledge experiences
                </p>
                <code className="block text-xs bg-muted p-2 rounded mt-2">
                  POST /v1/blocks
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Code */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Example: Creating a Block with AI</CardTitle>
            <CardDescription>
              Use AI assistance to generate high-quality content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">{`# 1. Create AI Configuration
POST /v1/ai/configurations
{
  "name": "Content Creator",
  "provider": "openai",
  "agent_type": "content_creator",
  "model_name": "gpt-4",
  "mcp_enabled": true
}

# 2. Start AI Job
POST /v1/ai/jobs
{
  "configuration_id": "uuid",
  "job_type": "content_creator",
  "input_prompt": "Create a Python tutorial"
}

# 3. Get Suggestions
GET /v1/ai/jobs/{job_id}/suggestions

# 4. Approve and Create Block
POST /v1/ai/suggestions/{id}/approve`}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">Swagger UI</div>
                  <div className="text-xs text-muted-foreground">Interactive API explorer</div>
                </div>
              </a>

              <Link
                href="/docs"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Book className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">API Reference</div>
                  <div className="text-xs text-muted-foreground">Full endpoint documentation</div>
                </div>
              </Link>

              <Link
                href="/mcp"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">MCP Guide</div>
                  <div className="text-xs text-muted-foreground">Context protocol details</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
