'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, SendHorizontal } from 'lucide-react'

function ChatInput({ onSend, placeholder = "Fale com o assistente ZapBroker..." }: {
  onSend?: (message: string) => void
  placeholder?: string
}) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    if (message.trim()) {
      onSend?.(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative w-full max-w-[620px] mx-auto">
      <div className="relative rounded-2xl bg-card border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.15)]">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder-muted-foreground px-5 pt-5 pb-3 focus:outline-none min-h-[80px] max-h-[200px]"
          style={{ height: '80px' }}
        />

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <button
            type="button"
            className="flex items-center justify-center size-9 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
            aria-label="Anexar arquivo"
          >
            <Paperclip className="size-4" />
          </button>

          <button
            onClick={handleSubmit}
            disabled={!message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-brand-green-500 hover:bg-brand-green-600 text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <span>Enviar</span>
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AnnouncementBadge({ text, href = "#" }: { text: string; href?: string }) {
  const className =
    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-green-500/10 text-brand-green-700 dark:text-brand-green-400 transition-transform hover:-translate-y-0.5"

  const content = (
    <>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-500 opacity-70" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green-500" />
      </span>
      {text}
    </>
  )

  return href !== '#' ? (
    <a href={href} className={className}>{content}</a>
  ) : (
    <span className={className}>{content}</span>
  )
}

export interface BoltStyleChatProps {
  title?: string
  subtitle?: string
  announcementText?: string
  announcementHref?: string
  placeholder?: string
  onSend?: (message: string) => void
}

export function BoltStyleChat({
  title = "Multiplique suas vendas no automático.",
  subtitle = "Crie campanhas de disparo em massa pelo WhatsApp em segundos com IA.",
  announcementText = "+1.247 corretores já usam a ZapBroker",
  announcementHref = "#",
  placeholder = "Fale com o assistente ZapBroker...",
  onSend,
}: BoltStyleChatProps) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full overflow-hidden bg-background pt-20 pb-16 px-4">
      {/* Soft radial glow, quiet and professional */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(60% 45% at 50% 0%, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0) 70%)',
        }}
      />

      <div className="relative flex flex-col items-center text-center w-full max-w-2xl">
        <div className="mb-6">
          <AnnouncementBadge text={announcementText} href={announcementHref} />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.05] mb-4" style={{ textWrap: 'balance' as any }}>
          {title}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg">{subtitle}</p>

        <div className="w-full mb-6">
          <ChatInput placeholder={placeholder} onSend={onSend} />
        </div>
      </div>
    </div>
  )
}
