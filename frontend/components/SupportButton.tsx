"use client"

import { useState } from 'react'
import { HelpCircle, MessageCircle, BookOpen, X } from 'lucide-react'
import { HowItWorksModal } from '@/components/dashboard/HowItWorksModal'

export default function SupportButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [showHowItWorks, setShowHowItWorks] = useState(false)

    return (
        <>
            <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end gap-2">
                {isOpen && (
                    <div className="bg-card border border-border rounded-2xl shadow-xl p-2 w-56 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <button
                            onClick={() => { setShowHowItWorks(true); setIsOpen(false) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-accent transition-colors text-left"
                        >
                            <BookOpen className="size-4 text-primary shrink-0" />
                            Como funciona
                        </button>
                        <a
                            href="https://wa.me/5551980985330?text=Olá,%20tenho%20interesse%20no%20ZapBroker!"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-accent transition-colors text-left"
                        >
                            <MessageCircle className="size-4 text-emerald-500 shrink-0" />
                            Falar no WhatsApp
                        </a>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen((v) => !v)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg transition-all hover:scale-110"
                    aria-label="Ajuda"
                >
                    {isOpen ? <X className="size-6" /> : <HelpCircle className="size-6" />}
                </button>
            </div>

            {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
        </>
    )
}
