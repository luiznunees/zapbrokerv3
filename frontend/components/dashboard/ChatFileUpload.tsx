"use client"

import { useRef, useState } from "react"
import { Paperclip, Loader2 } from "lucide-react"
import { api } from "@/services/api"

interface ChatFileUploadProps {
  onUploaded: (file: { url: string; mediaType: string; name: string }) => void
  disabled?: boolean
}

export function ChatFileUpload({ onUploaded, disabled }: ChatFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const data = await api.uploads.media(formData)
      onUploaded({ url: data.url, mediaType: data.mediaType, name: data.filename || file.name })
    } catch {
      // erro tratado pelo chamador via mensagem de fallback no chat
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mt-2">
      <input ref={inputRef} type="file" accept="image/*,video/*,audio/*" onChange={handleChange} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors text-sm text-foreground disabled:opacity-50"
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {isUploading ? "Enviando..." : "Anexar mídia"}
      </button>
    </div>
  )
}
