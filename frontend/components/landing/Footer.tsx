import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"
import { Mail, Phone, ArrowUpRight } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-landing-navy pt-10 pb-5">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                        <BrandLogo className="h-5 w-auto text-white" monochrome />
                        <p className="text-xs text-white/50 leading-relaxed max-w-xs">
                            Automação inteligente de WhatsApp para corretores de imóveis de alta performance.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-white uppercase tracking-wider">Produto</h4>
                        <ul className="space-y-1.5 text-xs text-white/50">
                            <li><Link href="#features" className="hover:text-landing-lime">Como funciona</Link></li>
                            <li><Link href="#pricing" className="hover:text-landing-lime">Preços</Link></li>
                            <li><Link href="/login" className="hover:text-landing-lime">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-white uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-1.5 text-xs text-white/50">
                            <li><Link href="/terms" className="hover:text-landing-lime">Termos de Uso</Link></li>
                            <li><Link href="/privacy" className="hover:text-landing-lime">Privacidade</Link></li>
                            <li><Link href="/lgpd" className="hover:text-landing-lime">LGPD</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-white uppercase tracking-wider">Fale com a gente</h4>
                        <ul className="space-y-1.5 text-xs text-white/50">
                            <li>
                                <a href="https://wa.me/5551980985330?text=Olá,%20tenho%20uma%20dúvida%20sobre%20o%20ZapBroker" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-landing-lime transition-colors">
                                    <Phone className="w-3 h-3 text-landing-lime" /> (51) 98098-5330
                                </a>
                            </li>
                            <li>
                                <a href="mailto:contato@zapbroker.dev" className="flex items-center gap-1.5 hover:text-landing-lime transition-colors">
                                    <Mail className="w-3 h-3 text-landing-lime" /> contato@zapbroker.dev
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-center text-xs text-white/40">
                    <p>&copy; {new Date().getFullYear()} ZapBroker. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}

export function CTA() {
    return (
        <section className="py-8 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="relative rounded-3xl landing-sky-gradient p-8 md:p-10 overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-white text-center md:text-left leading-tight max-w-md text-balance">
                            Pronto para multiplicar suas captações e fechar mais negócios?
                        </h2>

                        <Link
                            href="#pricing"
                            className="group shrink-0 flex items-center gap-2 pl-8 pr-2.5 py-3.5 bg-landing-lime hover:bg-landing-lime-dark text-landing-navy rounded-full font-black text-sm transition-colors"
                        >
                            Assinar agora
                            <span className="flex items-center justify-center size-8 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                                <ArrowUpRight className="size-4" />
                            </span>
                        </Link>
                    </div>

                    <p className="relative z-10 text-xs text-white/70 text-center md:text-left mt-5">
                        Ativação imediata &nbsp;•&nbsp; Pagamento via PIX &nbsp;•&nbsp; Cancele quando quiser
                    </p>
                </div>
            </div>
        </section>
    )
}
