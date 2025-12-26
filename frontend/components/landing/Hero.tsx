"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react'
import Image from 'next/image'

export function Hero() {
    const [city, setCity] = useState('Sua Cidade')
    const [loadingCity, setLoadingCity] = useState(true)

    useEffect(() => {
        async function getLocation() {
            try {
                // 1. Primary: geoip.vuiz.net (User requested)
                const response = await fetch('https://geoip.vuiz.net/geoip')
                if (response.ok) {
                    const data = await response.json()
                    if (data.city) {
                        setCity(data.city)
                        return
                    }
                }
            } catch (e) { console.warn('geoip.vuiz.net failed') }

            try {
                // 2. Fallback: ipapi.co
                const response = await fetch('https://ipapi.co/json/')
                if (response.ok) {
                    const data = await response.json()
                    if (data.city) {
                        setCity(data.city)
                        return
                    }
                }
            } catch (e) { console.warn('ipapi failed') }

            try {
                // 3. Fallback: geojs.io
                const response = await fetch('https://get.geojs.io/v1/ip/geo.json')
                if (response.ok) {
                    const data = await response.json()
                    if (data.city) {
                        setCity(data.city)
                        return
                    }
                }
            } catch (e) { console.warn('geojs failed') }

            // 4. Default if everything fails
            setCity('Capão da Canoa') // User preferred fallback
            setLoadingCity(false)
        }
        getLocation()
    }, [])

    return (
        <section className="relative pt-8 pb-10 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-purple-50 via-background to-background dark:from-brand-purple-900/20 dark:via-background dark:to-background">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="container relative mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-6">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-purple-100 dark:bg-brand-purple-900/40 text-brand-purple-600 dark:text-brand-purple-300 text-[10px] font-medium mb-3 animate-in fade-in slide-in-from-bottom-3">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-purple-500"></span>
                        </span>
                        +1.247 corretores já multiplicaram suas captações
                    </div>

                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-foreground leading-tight">
                        Corretor de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple-500 to-brand-purple-700">{city}</span>, <br />
                        Multiplique Suas Vendas no Automático
                    </h1>

                    <p className="text-xs md:text-sm text-muted-foreground mb-5 max-w-lg mx-auto leading-relaxed">
                        Automatize suas mensagens personalizadas e recupere seu tempo enquanto foca no que realmente importa: fechar negócios.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-brand-green-500 to-brand-green-600 hover:from-brand-green-400 hover:to-brand-green-500 text-white rounded-lg font-bold text-xs shadow-lg shadow-brand-green-500/20 transform transition-all hover:-translate-y-1"
                        >
                            Começar Teste Grátis de 7 Dias →
                        </Link>

                    </div>

                    <div className="mt-4 flex flex-wrap justify-center gap-2.5 text-[10px] text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-brand-green-500" /> 7 dias grátis
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-brand-green-500" /> Sem cartão de crédito
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-brand-green-500" /> Cancelamento fácil
                        </div>
                    </div>
                </div>

                {/* 3D Mockup Container */}
                <div className="relative mx-auto max-w-2xl perspective-1000">
                    <div className="relative rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out p-0.5">
                        <div className="rounded-lg overflow-hidden bg-zinc-900 border border-border/50 aspect-video relative flex items-center justify-center group">
                            <Image
                                src="/dashboard-screenshot.png"
                                alt="Dashboard ZapBroker"
                                fill
                                className="object-contain"
                                priority
                            />
                            {/* Overlay for better text contrast if needed */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple-900/10 to-transparent pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
