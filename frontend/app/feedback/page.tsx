"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { CheckCircle2, Loader2, MessageSquareHeart, AlertTriangle } from "lucide-react"
import { api } from "@/services/api"

const NPS_SCALE = Array.from({ length: 11 }, (_, i) => i) // 0-10
const EASE_SCALE = [1, 2, 3, 4, 5]

export default function FeedbackPage() {
    const shouldReduceMotion = useReducedMotion()
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    const [overallRating, setOverallRating] = useState<number | null>(null)
    const [easeRating, setEaseRating] = useState<number | null>(null)
    const [liked, setLiked] = useState("")
    const [confusing, setConfusing] = useState("")
    const [hadError, setHadError] = useState<boolean | null>(null)
    const [errorDescription, setErrorDescription] = useState("")
    const [improvements, setImprovements] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")

    useEffect(() => {
        try {
            const stored = localStorage.getItem("user")
            if (stored) {
                const user = JSON.parse(stored)
                if (user?.name) setName(user.name)
                if (user?.email) setEmail(user.email)
            }
        } catch {
            // sem sessão salva — segue com os campos vazios
        }
    }, [])

    const isEmpty = overallRating === null && easeRating === null && !liked.trim() && !confusing.trim() && !improvements.trim() && !errorDescription.trim()

    const handleSubmit = async () => {
        if (isEmpty) {
            setError("Escreve pelo menos alguma coisa antes de enviar — mesmo uma nota já ajuda.")
            return
        }
        setError("")
        setSubmitting(true)
        try {
            await api.feedback.submit({
                overallRating,
                easeRating,
                liked: liked.trim() || undefined,
                confusing: confusing.trim() || undefined,
                hadError,
                errorDescription: errorDescription.trim() || undefined,
                improvements: improvements.trim() || undefined,
                name: name.trim() || undefined,
                email: email.trim() || undefined,
                pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
            })
            setSubmitted(true)
        } catch (err: any) {
            setError(err?.message || "Não deu pra enviar agora. Tenta de novo em alguns segundos?")
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="max-w-md w-full text-center space-y-4"
                >
                    <div className="mx-auto flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="size-8" />
                    </div>
                    <h1 className="text-2xl font-black font-display text-foreground">Valeu por dedicar esse tempo!</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        Toda resposta aqui é lida direto — nada de painel automático genérico. Isso vai direto
                        pra decidir o que corrigir e o que construir a seguir no ZapBroker.
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-background px-4 py-12 sm:py-16">
            <div className="max-w-lg mx-auto">
                <div className="text-center space-y-2 mb-8">
                    <div className="mx-auto flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-primary mb-3">
                        <MessageSquareHeart className="size-6" />
                    </div>
                    <h1 className="text-2xl font-black font-display text-foreground">Como está sendo testar o ZapBroker?</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        Você é um dos poucos testando antes do lançamento — sua opinião sincera (boa ou ruim)
                        molda o produto agora, enquanto ainda é fácil mudar. Leva 2 minutos.
                    </p>
                </div>

                <div className="space-y-6">
                    <Section label="De 0 a 10, o quanto você indicaria o ZapBroker pra outro corretor?">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {NPS_SCALE.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setOverallRating(n)}
                                    className={`size-9 rounded-xl text-sm font-bold transition-all ${
                                        overallRating === n
                                            ? "bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/30"
                                            : "bg-accent/60 text-foreground/70 hover:bg-accent"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 px-1">
                            <span>Não indicaria</span>
                            <span>Indicaria com certeza</span>
                        </div>
                    </Section>

                    <Section label="Quão fácil foi usar, no geral?">
                        <div className="flex gap-2 justify-center">
                            {EASE_SCALE.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setEaseRating(n)}
                                    className={`flex-1 max-w-[64px] py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        easeRating === n
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                            : "bg-accent/60 text-foreground/70 hover:bg-accent"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 px-1">
                            <span>Muito confuso</span>
                            <span>Muito fácil</span>
                        </div>
                    </Section>

                    <Section label="O que você mais gostou até agora?">
                        <textarea
                            value={liked}
                            onChange={(e) => setLiked(e.target.value)}
                            placeholder="Ex: gostei de não precisar trocar de chip, o disparo rápido é direto ao ponto..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                        />
                    </Section>

                    <Section label="Teve alguma coisa que te confundiu, incomodou ou achou feio?">
                        <textarea
                            value={confusing}
                            onChange={(e) => setConfusing(e.target.value)}
                            placeholder="Pode ser bem direto — isso é o que mais nos ajuda a corrigir rápido."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                        />
                    </Section>

                    <Section label="Você bateu em algum erro ou travamento?">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setHadError(true)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    hadError === true
                                        ? "bg-destructive/10 text-destructive border border-destructive/30"
                                        : "bg-accent/60 text-foreground/70 hover:bg-accent border border-transparent"
                                }`}
                            >
                                <AlertTriangle className="size-3.5" /> Sim, tive erro
                            </button>
                            <button
                                type="button"
                                onClick={() => { setHadError(false); setErrorDescription("") }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    hadError === false
                                        ? "bg-primary/10 text-primary border border-primary/30"
                                        : "bg-accent/60 text-foreground/70 hover:bg-accent border border-transparent"
                                }`}
                            >
                                Não, tudo certo
                            </button>
                        </div>
                        <AnimatePresence>
                            {hadError === true && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <textarea
                                        value={errorDescription}
                                        onChange={(e) => setErrorDescription(e.target.value)}
                                        placeholder="O que você estava tentando fazer quando aconteceu? Quanto mais detalhe, melhor."
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-destructive/30 transition-shadow mt-3"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Section>

                    <Section label="Se você pudesse mudar ou adicionar uma coisa, o que seria?">
                        <textarea
                            value={improvements}
                            onChange={(e) => setImprovements(e.target.value)}
                            placeholder="Sem filtro — é exatamente pra isso que essa página existe."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                        />
                    </Section>

                    <Section label="Nome e email (opcional — só se topar que a gente responda)">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                            />
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                type="email"
                                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                            />
                        </div>
                    </Section>

                    {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                        {submitting ? "Enviando..." : "Enviar feedback"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-bold text-foreground mb-2.5">{label}</label>
            {children}
        </div>
    )
}
