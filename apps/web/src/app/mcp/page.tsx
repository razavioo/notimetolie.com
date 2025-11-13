import { PageHeader } from '@/components/PageHeader'
import { Network, Code, Search, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MCPDocumentationPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="MCP Server"
        description="Model Context Protocol integration for AI models"
        icon={<Network className="h-8 w-8 text-primary" />}
      />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              What is MCP?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The <strong>Model Context Protocol (MCP) Server</strong> allows AI models like Claude to directly 
              access and interact with your No Time To Lie content. This enables AI assistants to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                <Search className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Search Content</h4>
                  <p className="text-sm text-muted-foreground">Search and browse existing blocks and paths</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Read Content</h4>
                  <p className="text-sm text-muted-foreground">Access detailed content from blocks and paths</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Context-Aware</h4>
                  <p className="text-sm text-muted-foreground">Provide suggestions based on existing content</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
                <Code className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Smart Creation</h4>
                  <p className="text-sm text-muted-foreground">Help create content that aligns with existing knowledge</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start (3 Steps)</CardTitle>
            <CardDescription>Get your MCP server running in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <h4 className="text-lg font-semibold">Install Dependencies</h4>
              </div>
              <div className="ml-11 space-y-2">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`cd apps/api
source .venv/bin/activate
pip install mcp`}</code>
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <h4 className="text-lg font-semibold">Test the Server</h4>
              </div>
              <div className="ml-11 space-y-2">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`python run_mcp_server.py`}</code>
                </pre>
                <p className="text-sm text-muted-foreground">
                  You should see: "Starting MCP server for AI model integration..."
                  <br />
                  Press Ctrl+C to stop the test.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <h4 className="text-lg font-semibold">Configure Claude Desktop</h4>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Find your Claude Desktop config file:
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-medium min-w-24">macOS:</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">
                      ~/Library/Application Support/Claude/claude_desktop_config.json
                    </code>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-medium min-w-24">Windows:</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">
                      %APPDATA%\Claude\claude_desktop_config.json
                    </code>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-medium min-w-24">Linux:</span>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">
                      ~/.config/Claude/claude_desktop_config.json
                    </code>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Get your absolute project path:
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`cd /path/to/notimetolie.com/apps/api
pwd
# Copy the output`}</code>
                </pre>
                <p className="text-sm text-muted-foreground mt-3">
                  Add this to the config file:
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`{
  "mcpServers": {
    "notimetolie": {
      "command": "python",
      "args": [
        "/YOUR/PATH/HERE/notimetolie.com/apps/api/run_mcp_server.py"
      ],
      "env": {
        "DATABASE_URL": "sqlite+aiosqlite:///./notimetolie.db"
      }
    }
  }
}`}</code>
                </pre>
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg mt-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Important:</strong> Replace <code>/YOUR/PATH/HERE/</code> with your actual absolute path from the pwd command above.
                  </p>
                </div>
                <p className="text-sm font-semibold mt-3">
                  Restart Claude Desktop for changes to take effect.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Available Resources</CardTitle>
            <CardDescription>Content that AI models can access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">
                  <code className="text-sm">block://&#123;slug&#125;</code>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Individual content blocks in markdown format
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">
                  <code className="text-sm">path://&#123;slug&#125;</code>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Complete learning paths with all blocks included
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
            <CardDescription>Operations AI models can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">search_content</h4>
                <p className="text-sm text-muted-foreground">
                  Search for blocks and paths by keywords. Supports filtering by content type (block/path/all).
                </p>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  Parameters: query (string), type (block|path|all)
                </div>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">get_block_details</h4>
                <p className="text-sm text-muted-foreground">
                  Get detailed information about a specific block including full content.
                </p>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  Parameters: slug (string)
                </div>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">get_path_details</h4>
                <p className="text-sm text-muted-foreground">
                  Get complete learning path information including all blocks in order.
                </p>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  Parameters: slug (string)
                </div>
              </div>
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">list_recent_blocks</h4>
                <p className="text-sm text-muted-foreground">
                  List recently created or updated blocks (up to 50).
                </p>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  Parameters: limit (integer, default: 10)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
            <CardDescription>What you can ask AI once MCP is configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">🔍 Search Content</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm italic">"Search for blocks about Python in No Time To Lie"</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">📖 Read Blocks</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm italic">"Show me the content of the python-basics block"</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">🎯 Explore Paths</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm italic">"What's in the Complete Python Course learning path?"</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">💡 Context-Aware Creation</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm italic">
                    "I want to create a block about async programming. What related content already exists?"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Read-Only Access</h4>
                  <p className="text-sm text-muted-foreground">AI cannot create, modify, or delete content</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Published Content Only</h4>
                  <p className="text-sm text-muted-foreground">Unpublished or private content remains hidden</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Local Connections</h4>
                  <p className="text-sm text-muted-foreground">No network exposure, stdio-based communication</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">No Authentication Required</h4>
                  <p className="text-sm text-muted-foreground">Local stdio is inherently secure</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold mb-1">No MCP servers configured</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Check config file path is correct</li>
                  <li>Verify JSON syntax (no trailing commas)</li>
                  <li>Restart Claude Desktop</li>
                </ul>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold mb-1">Failed to connect to MCP server</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Verify Python is in your PATH</li>
                  <li>Check absolute path in config is correct</li>
                  <li>Test server manually: <code className="bg-muted px-1 rounded">python run_mcp_server.py</code></li>
                </ul>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold mb-1">No content returned</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Verify published blocks exist in database</li>
                  <li>Check blocks have <code className="bg-muted px-1 rounded">is_published=True</code></li>
                  <li>Test: <code className="bg-muted px-1 rounded text-xs">sqlite3 notimetolie.db "SELECT COUNT(*) FROM content_nodes WHERE is_published=1;"</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Full Documentation</CardTitle>
            <CardDescription>Comprehensive guides for advanced usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <a 
                href="/docs" 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">API Documentation</p>
                    <p className="text-sm text-muted-foreground">REST API endpoints and embedding guide</p>
                  </div>
                </div>
              </a>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">MCP_SERVER_SETUP.md</p>
                    <p className="text-sm text-muted-foreground">Complete setup guide (in repository)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">MCP_SERVER_QUICKSTART.md</p>
                    <p className="text-sm text-muted-foreground">Quick reference guide (in repository)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
