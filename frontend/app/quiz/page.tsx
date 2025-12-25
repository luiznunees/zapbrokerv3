"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, CheckCircle2, AlertTriangle, Timer, BarChart3, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"

// Quiz Data
const QUESTIONS = [
    {
        id: 1,
        question: "Quantos leads (contatos) você recebe por dia?",
        options: [
            { id: "a", text: "1 a 5 leads", score: 10 },
            { id: "b", text: "6 a 20 leads", score: 20 },
            { id: "c", text: "Mais de 20 leads", score: 30 }
        ]
    },
    {
        id: 2,
        question: "Quanto tempo você demora para responder um novo lead?",
        options: [
            { id: "a", text: "Imediatamente (em minutos)", score: 30 },
            { id: "b", text: "Até 1 hora", score: 20 },
            { id: "c", text: "Só no fim do dia ou dia seguinte", score: 0 }
        ]
    },
    {
        id: 3,
        question: "Como você faz o primeiro contato hoje?",
        options: [
            { id: "a", text: "Manualmente, um por um", score: 0 },
            { id: "b", text: "Lista de transmissão do WhatsApp", score: 10 },
            { id: "c", text: "Ferramenta de automação", score: 20 }
        ]
    },
    {
        id: 4,
        question: "Qual seu maior medo ao usar automação?",
        options: [
            { id: "a", text: "Ter meu número banido", type: "fear_ban" },
            { id: "b", text: "O atendimento parecer robótico", type: "fear_robot" },
            { id: "c", text: "Ser difícil de configurar", type: "fear_tech" }
        ]
    },
    {
        id: 5,
        question: "O que mudaria seu jogo hoje?",
        options: [
            { id: "a", text: "Atender leads em segundos (Vender mais)", type: "goal_sales" },
            { id: "b", text: "Parar de perder tempo copiando e colando", type: "goal_time" },
            { id: "c", text: "Organizar minha bagunça de contatos", type: "goal_org" }
        ]
    }
]

export default function QuizPage() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, any>>({})
    const [isFinished, setIsFinished] = useState(false)

    const currentQuestion = QUESTIONS[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100

    const handleAnswer = (option: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))

        if (currentQuestionIndex < QUESTIONS.length - 1) {
            setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 400)
        } else {
            setTimeout(() => setIsFinished(true), 400)
        }
    }

    const getResultContent = () => {
        // Simple logic to determine the "hook" based on answers
        const fear = answers[4]?.type
        const goal = answers[5]?.type

        let title = "Você está deixando dinheiro na mesa!"
        let description = "Sua rotina atual está limitando seu potencial de vendas. O ZapBroker pode automatizar esse processo."

        if (answers[2]?.score === 0) { // Slow response
            title = "A demora está matando suas vendas!"
            description = "Leads frios não compram. Com o ZapBroker, você atende em segundos, 24/7, e aumenta sua conversão em até 300%."
        } else if (answers[3]?.score === 0) { // Manual work
            title = "Pare de perder tempo com trabalho manual!"
            description = "Enquanto você digita 'Olá, tudo bem?' para um cliente, seu concorrente já agendou a visita com automação."
        }

        return { title, description, fear, goal }
    }

    if (isFinished) {
        const result = getResultContent()

        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 grid-pattern opacity-[0.05] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-card border border-border rounded-3xl p-8 shadow-2xl relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-brand-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-brand-purple-500/20">
                        <BarChart3 className="w-10 h-10 text-brand-purple-500" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple-500 to-pink-500">
                        {result.title}
                    </h1>

                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        {result.description}
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
                        <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
                            <Timer className="w-6 h-6 text-blue-500 mb-2" />
                            <h3 className="font-bold text-sm">Atendimento Imediato</h3>
                            <p className="text-xs text-muted-foreground">Responda leads em <span className="text-foreground font-medium">3 segundos</span>.</p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
                            <ShieldCheck className="w-6 h-6 text-green-500 mb-2" />
                            <h3 className="font-bold text-sm">Proteção Anti-Ban</h3>
                            <p className="text-xs text-muted-foreground">Envios humanizados que <span className="text-foreground font-medium">protegem seu chip</span>.</p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-xl border border-border/50">
                            <CheckCircle2 className="w-6 h-6 text-brand-purple-500 mb-2" />
                            <h3 className="font-bold text-sm">Fácil de Usar</h3>
                            <p className="text-xs text-muted-foreground">Conecte seu WhatsApp em <span className="text-foreground font-medium">1 minuto</span>.</p>
                        </div>
                    </div>

                    <Link
                        href="/signup"
                        className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 bg-gradient-to-r from-brand-purple-600 to-brand-purple-500 hover:from-brand-purple-500 hover:to-brand-purple-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-purple-500/25 transition-all hover:-translate-y-1"
                    >
                        Começar Teste Grátis Agora
                        <ArrowRight className="w-5 h-5" />
                    </Link>

                    <p className="mt-4 text-xs text-muted-foreground">
                        Teste grátis por 7 dias. Não precisa de cartão.
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 grid-pattern opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-purple-500/5 to-transparent pointer-events-none" />

            <div className="max-w-xl w-full relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <BrandLogo className="h-8 w-auto text-brand-purple-600" />
                    <div className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                        Pergunta {currentQuestionIndex + 1} de {QUESTIONS.length}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-secondary rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-brand-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl"
                    >
                        <h2 className="text-2xl font-bold mb-8 leading-tight">
                            {currentQuestion.question}
                        </h2>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleAnswer(option)}
                                    className="w-full text-left p-4 rounded-xl border border-border hover:border-brand-purple-500 hover:bg-brand-purple-50 dark:hover:bg-brand-purple-900/10 transition-all duration-200 flex items-center justify-between group"
                                >
                                    <span className="font-medium group-hover:text-brand-purple-600 transition-colors">
                                        {option.text}
                                    </span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-brand-purple-500" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
