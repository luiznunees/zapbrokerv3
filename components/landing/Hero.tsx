import Link from 'next/link'
import { ArrowRight, Sparkles, MessageSquare } from 'lucide-react'
import WhatsAppDemo from '@/components/landing/WhatsAppDemo'
import ScrollAnimation from '@/components/ui/ScrollAnimation'

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="container px-4 mx-auto relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Text */}
                    <div className="text-left max-w-2xl">
                        <ScrollAnimation animation="fade-up">
                            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6 transition-colors hover:bg-primary/10">
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>IA que vive no seu WhatsApp</span>
                            </div>
                        </ScrollAnimation>

                        <ScrollAnimation animation="fade-up" delay={200}>
                            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6 leading-tight">
                                Seu "Estagiário" de Vendas mora no{' '}
                                <span className="bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent animate-pulse-slow">
                                    WhatsApp
                                </span>
                            </h1>
                        </ScrollAnimation>

                        <ScrollAnimation animation="fade-up" delay={400}>
                            <p className="mt-4 text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
                                Esqueça dashboards complexos. Apenas peça: <br />
                                <span className="italic text-foreground">"Zap, dispara a oferta do Leblon pra quem visualizou mês passado."</span>
                                <br /> E ele executa.
                            </p>
                        </ScrollAnimation>

                        <ScrollAnimation animation="fade-up" delay={600}>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/waitlist" className="relative overflow-hidden group px-8 py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Testar no meu Zap</span>
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                </Link>
                                <Link href="/dashboard" className="px-8 py-3.5 bg-card hover:bg-accent text-foreground border border-border rounded-xl font-medium transition-colors flex items-center justify-center">
                                    Ver Demonstração
                                </Link>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                Setup instantâneo via QR Code
                            </p>
                        </ScrollAnimation>
                    </div>

                    {/* Right Column: Demo Animation */}
                    <ScrollAnimation animation="scale-up" delay={800}>
                        <div className="relative flex justify-center lg:justify-end">
                            {/* Decorative blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>

                            {/* The Phone */}
                            <div className="relative transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 hover:scale-105">
                                <WhatsAppDemo />

                                {/* Floating Badge */}
                                <div className="absolute -right-4 top-20 bg-card/90 backdrop-blur border border-border p-3 rounded-xl shadow-xl animate-float-slow hidden sm:block">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">Taxa de Abertura</p>
                                            <p className="text-lg font-bold text-green-600">98%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollAnimation>

                </div>
            </div>
        </section>
    )
}
