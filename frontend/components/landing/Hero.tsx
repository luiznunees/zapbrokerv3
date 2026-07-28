"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { WhatsAppMockup } from './WhatsAppMockup'

export function Hero() {
    const [city, setCity] = useState('Sua Cidade')

    useEffect(() => {
        async function getLocation() {
            try {
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
                const response = await fetch('https://get.geojs.io/v1/ip/geo.json')
                if (response.ok) {
                    const data = await response.json()
                    if (data.city) {
                        setCity(data.city)
                        return
                    }
                }
            } catch (e) { console.warn('geojs failed') }

            setCity('Capão da Canoa')
        }
        getLocation()
    }, [])

    return (
        <section className="relative pt-10 pb-14 md:pt-14 md:pb-16 overflow-hidden bg-background">
            <div className="container relative mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">

                    {/* Left: copy */}
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green-500/10 text-brand-green-700 dark:text-brand-green-400 text-[11px] font-semibold mb-4">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green-500" />
                            </span>
                            Direto no seu WhatsApp, sem trocar de número
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight mb-4 text-foreground leading-[1.1]">
                            Corretor de {city}, dispare mensagens em massa e{' '}
                            <span className="text-brand-green-600 dark:text-brand-green-400">não esqueça</span>{' '}
                            nenhum lead
                        </h1>

                        <p className="text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                            Crie disparos pro seus leads em segundos e deixe o agente avisar quem não respondeu. Você aprova cada lembrete antes de sair — sem trocar de número, sem aprender sistema novo.
                        </p>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto text-center px-6 py-3 bg-brand-green-500 hover:bg-brand-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-green-500/20 transition-colors"
                            >
                                Começar Teste Grátis de 7 Dias →
                            </Link>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-500" /> 7 dias grátis
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-500" /> Sem cartão de crédito
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-green-500" /> Continua no seu número
                            </div>
                        </div>
                    </div>

                    {/* Right: real WhatsApp conversation mockup — proof, not decoration */}
                    <div className="relative flex items-center justify-center">
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(55% 55% at 50% 50%, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0) 70%)',
                            }}
                        />
                        <WhatsAppMockup />
                    </div>
                </div>
            </div>
        </section>
    )
}
