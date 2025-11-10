'use client'

import { useMemo, useState } from 'react'

interface SharePanelProps {
  nodeType: 'block' | 'path'
  nodeId: string
  slug?: string
}

export function SharePanel({ nodeType, nodeId, slug }: SharePanelProps) {
  const [width, setWidth] = useState<string>('100%')
  const [height, setHeight] = useState<string>('420')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard')
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            className="px-3 py-2 border rounded-md"
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
            className="px-3 py-2 border rounded-md w-36"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Height</label>
          <input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 420"
            className="px-3 py-2 border rounded-md w-36"
          />
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">iframe snippet</span>
          <button
            onClick={() => copyToClipboard(iframeSnippet)}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
          >
            Copy
          </button>
        </div>
        <pre className="text-xs bg-white p-3 border rounded overflow-auto">
{iframeSnippet}
        </pre>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">SDK snippet (optional)</span>
          <button
            onClick={() => copyToClipboard(sdkSnippet)}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
          >
            Copy
          </button>
        </div>
        <pre className="text-xs bg-white p-3 border rounded overflow-auto">
{sdkSnippet}
        </pre>
      </div>
    </div>
  )
}

