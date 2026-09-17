"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Bot, Sparkles, Send } from "lucide-react"

// Mirrors the real dashboard (a chat with the AI agent, not a kanban board) —
// see app/dashboard/page.tsx: "Assistente ZapBroker" chip + agent/user bubbles.
export function AgentChatMockup() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <div className="w-full h-full bg-zinc-900 flex flex-col p-4 overflow-hidden relative select-none">
            <div className="flex items-center justify-center mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[9px] font-medium">
                    <Sparkles className="w-2.5 h-2.5" />
                    Assistente ZapBroker
                </div>
            </div>

            <div className="flex-1 space-y-3">
                <motion.div
                    className="flex gap-2 justify-end"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                    <div className="max-w-[75%] bg-primary text-white text-[10px] px-3 py-2 rounded-2xl rounded-tr-sm">
                        Dispara pra quem não visitou ainda esse mês
                    </div>
                </motion.div>

                <motion.div
                    className="flex gap-2 items-start"
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.9 }}
                >
                    <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-primary/80 to-landing-sky-deep/80 flex items-center justify-center shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="max-w-[75%] bg-zinc-800 border border-white/5 text-zinc-300 text-[10px] px-3 py-2 rounded-2xl rounded-tl-sm space-y-1.5">
                        <p>Encontrei 42 leads sem visita. Envio um lembrete pra eles?</p>
                        <div className="flex gap-1.5 pt-1">
                            <span className="text-[8px] bg-primary text-white px-2 py-1 rounded-full font-medium">Enviar agora</span>
                            <span className="text-[8px] bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full font-medium">Agendar</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="mt-3 flex items-center gap-2 bg-zinc-800 border border-white/5 rounded-full px-3 py-2">
                <span className="text-[9px] text-zinc-500 flex-1">Fale com o agente...</span>
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Send className="w-2.5 h-2.5 text-white" />
                </div>
            </div>
        </div>
    )
}
