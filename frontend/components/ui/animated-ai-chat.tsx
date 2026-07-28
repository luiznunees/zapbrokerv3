"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Paperclip, X, Sparkles, FileText, Users, Image as ImageIcon, Mic } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export type AttachType = "files" | "contacts" | "media" | "audio"

interface AttachmentInfo {
  name: string
  mediaType: string
}

interface AnimatedAIChatProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onSelectAttachType?: (type: AttachType) => void
  attachment?: AttachmentInfo | null
  onRemoveAttachment?: () => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
}

const ATTACH_OPTIONS: Array<{ type: AttachType; icon: typeof FileText; label: string; desc: string }> = [
  { type: "files", icon: FileText, label: "Arquivos", desc: "PDF, planilhas, documentos" },
  { type: "contacts", icon: Users, label: "Lista de contatos", desc: "Importar leads (CSV/XLSX/PDF)" },
  { type: "media", icon: ImageIcon, label: "Foto ou vídeo", desc: "Imagem ou vídeo para o disparo" },
  { type: "audio", icon: Mic, label: "Áudio", desc: "Arquivo de áudio já gravado" },
]

export function AnimatedAIChat({
  value,
  onChange,
  onSend,
  onSelectAttachType,
  attachment,
  onRemoveAttachment,
  placeholder = "Envie uma mensagem...",
  disabled = false,
  isLoading = false,
}: AnimatedAIChatProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false)

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
    }
  }, [value])

  useEffect(() => {
    if (!isAttachMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isAttachMenuOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // e.repeat é true em eventos de auto-repeat do SO (tecla segurada) — sem isso,
    // seguraro Enter dispara onSend() dezenas de vezes com o mesmo texto.
    if (e.key === "Enter" && !e.shiftKey && !e.repeat) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <motion.div
      animate={{
        scale: isFocused ? 1.015 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative"
    >
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-foreground/10 via-foreground/5 to-transparent opacity-50 pointer-events-none" />
      <div
        className={`
          relative rounded-3xl transition-all duration-300
          ${isFocused
            ? "glass-floating shadow-[0_0_40px_rgba(168,85,247,0.12)] ring-1 ring-purple-500/25"
            : "glass shadow-lg"
          }
        `}
      >
        <div className="relative flex items-end gap-2 px-4 pt-4 pb-2">
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-500 text-xs max-w-[220px]"
              >
                <Paperclip className="size-3 shrink-0" />
                <span className="truncate">{attachment.name}</span>
                <button onClick={onRemoveAttachment} className="ml-1 hover:text-foreground shrink-0">
                  <X className="size-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent px-4 pb-3 text-sm text-foreground placeholder:text-muted-foreground outline-none min-h-[24px] max-h-[200px] disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <div ref={menuRef} className="relative">
            <AnimatePresence>
              {isAttachMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl glass-floating shadow-2xl p-1.5 z-20"
                >
                  {ATTACH_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => {
                        setIsAttachMenuOpen(false)
                        onSelectAttachType?.(opt.type)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-accent transition-colors"
                    >
                      <span className="flex items-center justify-center size-8 rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
                        <opt.icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm text-foreground/90">{opt.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAttachMenuOpen((v) => !v)}
              className="flex items-center justify-center size-9 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <Paperclip className="size-4" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSend}
            disabled={!value.trim() || disabled || isLoading}
            className={`
              flex items-center justify-center size-9 rounded-2xl transition-all
              ${value.trim() && !disabled && !isLoading
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-400"
                : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Sparkles className="size-4" />
              </motion.div>
            ) : (
              <ArrowUp className="size-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
