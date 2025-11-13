import { PageHeader } from '@/components/PageHeader'
import { BookOpen } from 'lucide-react'

export default function DocsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="API & Embedding"
        description="Documentation for developers integrating content"
        icon={<BookOpen className="h-8 w-8 text-primary" />}
      />

      <section className="space-y-3 mb-8">
        <h2 className="text-xl font-semibold">Base URL</h2>
        <p className="text-sm text-muted-foreground">
          Configure the API base via <code className="bg-muted px-1 rounded text-foreground/80">NEXT_PUBLIC_API_URL</code>.
          Defaults to <code className="bg-muted px-1 rounded text-foreground/80">http://localhost:8000</code>.
        </p>
      </section>

      <section className="space-y-3 mb-8">
        <h2 className="text-xl font-semibold">Core Endpoints</h2>
        <ul className="list-disc pl-6 text-sm">
          <li><code className="bg-muted px-1 rounded text-foreground/80">GET /v1/blocks</code> – List public blocks</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">GET /v1/blocks/{'{'}slug{'}'}</code> – Get block by slug</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">POST /v1/blocks</code> – Create block</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">PUT /v1/blocks/{'{'}id{'}'}</code> – Update block</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">DELETE /v1/blocks/{'{'}id{'}'}</code> – Delete block</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">GET /v1/paths</code> – List public paths</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">GET /v1/paths/{'{'}slug{'}'}</code> – Get path by slug</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">POST /v1/paths</code> – Create path</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">PUT /v1/paths/{'{'}id{'}'}</code> – Update path</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">DELETE /v1/paths/{'{'}id{'}'}</code> – Delete path</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">GET /v1/blocks/{'{'}id{'}'}/suggestions</code> – List suggestions</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">POST /v1/blocks/{'{'}id{'}'}/suggestions</code> – Create suggestion</li>
          <li><code className="bg-muted px-1 rounded text-foreground/80">GET /v1/embed/{'{'}node_type{'}'}/{'{'}id{'}'}</code> – Embed endpoint</li>
        </ul>
      </section>

      <section className="space-y-3 mb-8">
        <h2 className="text-xl font-semibold">Embedding</h2>
        <p className="text-sm text-muted-foreground">
          Each block and path detail page provides a Share panel with an iframe snippet and an SDK placeholder.
        </p>
        <pre className="text-xs bg-muted p-3 border rounded overflow-auto text-foreground/90">
{`<iframe
  src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1/embed/block/{BLOCK_ID}?theme=light"
  width="100%"
  height="420"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
></iframe>`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Front-end Notes</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Block editor uses <code className="bg-muted px-1 rounded text-foreground/80">@blocknote/react</code>.</li>
          <li>Suggestions are created with a mandatory Change Summary.</li>
          <li>Paths compose ordered blocks; selection is available in the path form.</li>
        </ul>
      </section>
    </main>
  )
}

