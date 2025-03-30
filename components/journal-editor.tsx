"use client"
import { Textarea } from "@/components/ui/textarea"

interface JournalEditorProps {
  content: string
  onChange: (value: string) => void
}

export function JournalEditor({ content, onChange }: JournalEditorProps) {
  return (
    <div className="min-h-[300px] rounded-md border">
      <Textarea
        placeholder="Write your thoughts here..."
        className="min-h-[300px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

