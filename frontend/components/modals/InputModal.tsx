'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (value: string) => void
    title: string
    description?: string
    placeholder?: string
    defaultValue?: string
}

export function InputModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    placeholder = '',
    defaultValue = ''
}: InputModalProps) {
    const [value, setValue] = useState(defaultValue)

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (value.trim()) {
            onConfirm(value.trim())
            setValue('')
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className={cn(
                                "flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-colors",
                                value.trim() ? "hover:bg-primary/90" : "opacity-50 cursor-not-allowed"
                            )}
                        >
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
