import { BlockNoteEditor, Block } from '@blocknote/core'
import { BlockNoteView, useBlockNote } from '@blocknote/react'
import '@blocknote/core/style.css'

interface BlockEditorProps {
  initialContent?: Block[]
  onChange?: (content: Block[]) => void
  placeholder?: string
  editable?: boolean
}

export function BlockEditor({
  initialContent = [],
  onChange,
  placeholder = "Start writing...",
  editable = true
}: BlockEditorProps) {
  const editor: BlockNoteEditor | null = useBlockNote({
    initialContent,
    onEditorContentChange: (editor) => {
      if (editable && onChange) {
        onChange(editor.topLevelBlocks)
      }
    },
  })

  if (!editor) {
    return <div className="p-4 border rounded-lg">Loading editor...</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <BlockNoteView
        editor={editor}
        className="min-h-[200px] p-4"
        theme={'light'}
        editable={editable}
      />
    </div>
  )
}