"use client"

import { PlayCircle, BookOpen, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

const TUTORIALS = [
    {
        id: 1,
        title: "Como criar sua primeira campanha",
        description: "Passo a passo para enviar mensagens em massa sem bloqueios.",
        category: "Campanhas",
        duration: "5 min",
        icon: PlayCircle
    },
    {
        id: 2,
        title: "Cadastrando imóveis e leads",
        description: "Organize sua base de contatos e produtos de forma eficiente.",
        category: "Gestão",
        duration: "3 min",
        icon: BookOpen
    },
    {
        id: 3,
        title: "Melhores práticas do WhatsApp",
        description: "Dicas para aumentar a taxa de resposta e evitar banimentos.",
        category: "Dicas",
        duration: "7 min",
        icon: BookOpen
    },
    {
        id: 4,
        title: "Usando o Kanban de Leads",
        description: "Mova seus leads pelas etapas do funil de vendas visualmente.",
        category: "CRM",
        duration: "4 min",
        icon: PlayCircle
    }
]

export default function TutorialsPage() {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Blog & Tutoriais</h1>
                <p className="text-muted-foreground">Aprenda a usar o máximo da plataforma ZapBroker.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TUTORIALS.map((tutorial) => (
                    <Link href={`/dashboard/tutorials/${tutorial.id}`} key={tutorial.id} className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer block">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <tutorial.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full text-secondary-foreground">
                                {tutorial.category}
                            </span>
                        </div>

                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                            {tutorial.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {tutorial.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border group-hover:border-border/50 transition-colors">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {tutorial.duration} de leitura
                            </div>
                            <div className="flex items-center gap-1 font-medium text-foreground group-hover:translate-x-1 transition-transform">
                                Ler artigo <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
