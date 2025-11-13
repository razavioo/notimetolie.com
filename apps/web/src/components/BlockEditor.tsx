import { useState, useEffect } from 'react'

interface BlockEditorProps {
  initialContent?: any[]
  onChange?: (content: any[]) => void
  placeholder?: string
  editable?: boolean
}

export function BlockEditor({
  initialContent = [],
  onChange,
  placeholder = "Start writing...",
  editable = true
}: BlockEditorProps) {
  const [textContent, setTextContent] = useState('')

  useEffect(() => {
    if (initialContent && initialContent.length > 0) {
      // Convert initial content to text
      const text = initialContent.map(block =>
        block?.content || block?.text || ''
      ).join('\n')
      setTextContent(text)
    }
  }, [initialContent])

  useEffect(() => {
    if (onChange) {
      // Convert text back to a simple block-like structure
      const blocks = textContent.trim() ? [{
        type: 'paragraph',
        content: textContent,
        id: 'block-1'
      }] : []
      onChange(blocks)
    }
  }, [textContent, onChange])

  if (!editable) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="prose max-w-none">
          {textContent || <span className="text-gray-500">{placeholder}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <textarea
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[200px] p-4 border-none outline-none resize-none"
        style={{
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      />
    </div>
  )
}