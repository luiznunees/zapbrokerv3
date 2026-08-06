"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CreditCard, Smartphone, Star } from 'lucide-react'
import { WhatsAppMockup } from './WhatsAppMockup'

const AVATAR_COLORS = ['bg-primary/20', 'bg-indigo-200', 'bg-primary/30', 'bg-indigo-300']

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
                        <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight mb-4 text-foreground leading-[1.1]">
                            Corretor de {city}, nunca mais esqueça um lead no{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">WhatsApp</span>.
                        </h1>

                        <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed">
                            O ZapBroker envia campanhas no automático, acompanha quem não respondeu e sugere lembretes. Você aprova tudo em um clique.
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-foreground/80">
                                <Clock className="w-3.5 h-3.5 text-primary" /> Ativação em 2 minutos
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-foreground/80">
                                <CreditCard className="w-3.5 h-3.5 text-primary" /> Pagamento via PIX
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-foreground/80">
                                <Smartphone className="w-3.5 h-3.5 text-primary" /> Continua no seu número
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto text-center px-6 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-sm shadow-lg shadow-primary/20 transition-colors"
                            >
                                Assinar Agora →
                            </Link>
                        </div>

                        <div className="mt-5 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {AVATAR_COLORS.map((color, i) => (
                                    <div key={i} className={`w-7 h-7 rounded-full border-2 border-white ${color}`} />
                                ))}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                                <p className="font-bold text-foreground">+2.500 corretores já usam</p>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                                    <span className="ml-1">4.9/5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: real WhatsApp conversation mockup — proof, not decoration */}
                    <div className="relative flex items-center justify-center">
                        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'radial-gradient(55% 55% at 50% 50%, rgba(138,91,245,0.10) 0%, rgba(138,91,245,0) 70%)',
                            }}
                        />
                        <WhatsAppMockup />
                    </div>
                </div>
            </div>
        </section>
    )
}
