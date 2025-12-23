"use client"

import { BrandLogo } from "@/components/BrandLogo"
import Link from "next/link"
import { CheckCircle2, PlayCircle } from "lucide-react"

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Minimal Header */}
            <header className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <BrandLogo className="h-6 w-auto" />
                    </Link>
                    <Link
                        href="/signup"
                        className="px-3 py-1.5 bg-brand-green-600 text-white rounded-lg text-xs font-bold hover:bg-brand-green-700 transition-colors"
                    >
                        Criar Conta Grátis
                    </Link>
                </div>
            </header>

            <main className="flex-1 pt-24 pb-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-purple-100 dark:bg-brand-purple-900/40 text-brand-purple-600 dark:text-brand-purple-300 text-[10px] font-medium mb-4">
                            <PlayCircle className="w-3 h-3" />
                            Demonstração Interativa
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                            Veja o ZapBroker em Ação na Prática
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto">
                            Em menos de 2 minutos, entenda como nossa plataforma pode transformar sua captação de leads.
                        </p>
                    </div>

                    {/* Video Placeholder */}
                    <div className="relative aspect-video rounded-xl bg-zinc-900 border border-border shadow-2xl overflow-hidden group mb-10">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple-600/20 text-brand-purple-500 group-hover:scale-110 transition-transform cursor-pointer">
                                    <PlayCircle className="w-8 h-8 fill-current" />
                                </span>
                                <p className="text-xs text-muted-foreground font-medium">Vídeo de Demonstração (Placeholder)</p>
                            </div>
                        </div>
                        {/* 
                           To embed a real video (YouTube/Vimeo/S3):
                           <iframe src="YOUR_VIDEO_URL" className="w-full h-full" ... />
                        */}
                    </div>

                    {/* Key Features Recap */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-10">
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="text-sm font-bold mb-1">Disparo em Massa</h3>
                            <p className="text-[10px] text-muted-foreground">Envie centenas de mensagens personalizadas sem risco de banimento.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="text-sm font-bold mb-1">CRM Kanban</h3>
                            <p className="text-[10px] text-muted-foreground">Organize seus leads em colunas visuais e nunca perca uma venda.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-card border border-border">
                            <h3 className="text-sm font-bold mb-1">IA Generativa</h3>
                            <p className="text-[10px] text-muted-foreground">Deixe nossa IA criar abordagens persuasivas para cada cliente.</p>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center bg-card border border-border rounded-xl p-8">
                        <h2 className="text-lg font-bold mb-2">Gostou do que viu?</h2>
                        <p className="text-xs text-muted-foreground mb-4">
                            Você não precisa pagar nada para testar. Comece agora.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href="/signup"
                                className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-brand-green-500 to-brand-green-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-brand-green-500/20 hover:opacity-90 transition-opacity"
                            >
                                Iniciar Teste Grátis de 7 Dias
                            </Link>
                            <Link
                                href="/"
                                className="w-full sm:w-auto px-5 py-2 border border-border text-foreground hover:bg-accent rounded-lg font-bold text-xs transition-colors"
                            >
                                Voltar para Home
                            </Link>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-brand-green-500" /> Sem compromisso</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-brand-green-500" /> Cancela fácil</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
