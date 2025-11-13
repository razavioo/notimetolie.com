'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface SharePanelProps {
  nodeType: 'block' | 'path'
  nodeId: string
  slug?: string
}

export function SharePanel({ nodeType, nodeId, slug }: SharePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState<string>('100%')
  const [height, setHeight] = useState<string>('420')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const WEB_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const iframeSrc = useMemo(() => {
    const base = `${API_BASE_URL}/v1/embed/${nodeType}/${nodeId}`
    const params = new URLSearchParams({ theme })
    return `${base}?${params.toString()}`
  }, [API_BASE_URL, nodeType, nodeId, theme])

  const iframeSnippet = useMemo(
    () => `<iframe
  src="${iframeSrc}"
  width="${width}"
  height="${height}"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  title="${nodeType === 'block' ? 'Block' : 'Path'}: ${slug || nodeId}"
></iframe>`,
    [iframeSrc, width, height, nodeType, slug, nodeId]
  )

  const sdkSnippet = useMemo(
    () => `<!-- Optional SDK example (future) -->
<script src="https://cdn.notimetolie.com/sdk.min.js"></script>
<div id="nttl-${nodeType}-${nodeId}"></div>
<script>
  NTTL.render({
    mount: '#nttl-${nodeType}-${nodeId}',
    baseUrl: '${API_BASE_URL}',
    nodeType: '${nodeType}',
    id: '${nodeId}',
    theme: '${theme}',
    width: '${width}',
    height: '${height}'
  })
</script>`,
    [API_BASE_URL, nodeType, nodeId, theme, width, height]
  )

  const pageUrl = useMemo(() => {
    return `${WEB_BASE_URL}/${nodeType}s/${slug || nodeId}`
  }, [WEB_BASE_URL, nodeType, slug, nodeId])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(label)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (e) {
      console.error('Copy failed', e)
      alert('Failed to copy. Please try again.')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        title="Share this content"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
    )
  }

  return (
    <div className="border-t border-border dark:border-gray-700 pt-6">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-card space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold">Share Options</h4>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          title="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Page URL */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Page URL</span>
          <button
            onClick={() => copyToClipboard(pageUrl, 'url')}
            className="text-xs px-2 py-1 border rounded hover:bg-accent flex items-center gap-1"
          >
            {copiedItem === 'url' ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="text-sm bg-background p-2 border rounded break-all">
          {pageUrl}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Width</label>
          <input
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="e.g. 100% or 800"
            className="px-3 py-2 border rounded-md w-36 bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Height</label>
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 420"
            className="px-3 py-2 border rounded-md w-36 bg-background"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Embed Code (iframe)</span>
          <button
            onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
            className="text-xs px-2 py-1 border rounded hover:bg-accent flex items-center gap-1"
          >
            {copiedItem === 'iframe' ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="text-xs bg-background p-3 border rounded overflow-auto">
{iframeSnippet}
        </pre>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">SDK Snippet (Advanced)</span>
          <button
            onClick={() => copyToClipboard(sdkSnippet, 'sdk')}
            className="text-xs px-2 py-1 border rounded hover:bg-accent flex items-center gap-1"
          >
            {copiedItem === 'sdk' ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="text-xs bg-background p-3 border rounded overflow-auto">
{sdkSnippet}
        </pre>
      </div>
      </div>
    </div>
  )
}

