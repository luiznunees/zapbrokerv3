import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"
import { Mail, Phone } from "lucide-react"
import { GradientBlobs } from "@/components/auth/AuthFormControls"

export function Footer() {
    return (
        <footer className="bg-white pt-10 pb-5">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                        <BrandLogo className="h-5 w-auto" />
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                            Automação inteligente de WhatsApp para corretores de imóveis de alta performance.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-foreground uppercase">Produto</h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li><Link href="#features" className="hover:text-primary">Como funciona</Link></li>
                            <li><Link href="#pricing" className="hover:text-primary">Preços</Link></li>
                            <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-foreground uppercase">Legal</h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li><Link href="/terms" className="hover:text-primary">Termos de Uso</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary">Privacidade</Link></li>
                            <li><Link href="/lgpd" className="hover:text-primary">LGPD</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-foreground uppercase">Fale com a gente</h4>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                            <li>
                                <a href="https://wa.me/5551980985330?text=Olá,%20tenho%20uma%20dúvida%20sobre%20o%20ZapBroker" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <Phone className="w-3 h-3 text-primary" /> (51) 98098-5330
                                </a>
                            </li>
                            <li>
                                <a href="mailto:contato@zapbroker.dev" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                    <Mail className="w-3 h-3 text-primary" /> contato@zapbroker.dev
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
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
                <div className="relative rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-primary/60 p-8 md:p-10 overflow-hidden">
                    <GradientBlobs />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-white text-center md:text-left leading-tight max-w-md">
                            Pronto para multiplicar suas captações e fechar mais negócios?
                        </h2>

                        <Link
                            href="#pricing"
                            className="shrink-0 px-8 py-3.5 bg-white text-primary rounded-full font-black text-sm shadow-lg hover:bg-white/90 transition-all transform hover:-translate-y-0.5"
                        >
                            Assinar agora →
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
