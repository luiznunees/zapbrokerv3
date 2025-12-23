import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"

export function Footer() {
    return (
        <footer className="bg-background border-t border-border pt-8 pb-4">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <BrandLogo className="h-3.5 w-auto" />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs">
                            Automação inteligente de WhatsApp para corretores de imóveis de alta performance.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-1.5 text-[10px]">Produto</h4>
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                            <li><Link href="#features">Como funciona</Link></li>
                            <li><Link href="#pricing">Preços</Link></li>
                            <li><Link href="/login">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-1.5 text-[10px]">Legal</h4>
                        <ul className="space-y-1 text-[10px] text-muted-foreground">
                            <li><Link href="/terms">Termos de Uso</Link></li>
                            <li><Link href="/privacy">Privacidade</Link></li>
                            <li><Link href="/lgpd">LGPD</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-3 text-center text-[10px] text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} ZapBroker. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}

export function CTA() {
    return (
        <section className="py-8 bg-gradient-to-br from-brand-green-400 to-brand-green-600 dark:from-brand-green-600 dark:to-brand-green-800 text-white relative overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="container relative mx-auto px-4 md:px-6 text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-2">Você Chegou no Fim da Página.</h2>
                <p className="text-xs md:text-sm text-white/90 mb-5 max-w-lg mx-auto">
                    Pronto para multiplicar suas captações, fazer mais visitas e fechar mais negócios?
                </p>

                <div className="flex flex-col items-center gap-2">
                    <Link
                        href="/signup"
                        className="px-5 py-2.5 bg-white text-brand-green-600 rounded-lg font-bold text-sm shadow-lg hover:bg-zinc-50 transition-colors transform hover:-translate-y-1"
                    >
                        Começar Teste Grátis →
                    </Link>
                    <p className="text-[10px] text-white/70">
                        Sem cartão, sem compromisso, cancele quando quiser
                    </p>
                </div>
            </div>
        </section>
    )
}
