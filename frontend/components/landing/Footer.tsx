import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"
import { DoodleSquiggle } from "./Doodle"

export function Footer() {
    return (
        <footer className="bg-[#f6f4f1] pt-10 pb-5">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <BrandLogo className="h-4 w-auto" />
                        </div>
                        <p className="text-xs text-[#6f6b76] leading-relaxed max-w-xs">
                            Automação inteligente de WhatsApp para corretores de imóveis de alta performance.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-[#0a0a0a] uppercase">Produto</h4>
                        <ul className="space-y-1.5 text-xs text-[#6f6b76]">
                            <li><Link href="#features" className="hover:text-[#0a0a0a]">Como funciona</Link></li>
                            <li><Link href="#pricing" className="hover:text-[#0a0a0a]">Preços</Link></li>
                            <li><Link href="/login" className="hover:text-[#0a0a0a]">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black mb-2 text-xs text-[#0a0a0a] uppercase">Legal</h4>
                        <ul className="space-y-1.5 text-xs text-[#6f6b76]">
                            <li><Link href="/terms" className="hover:text-[#0a0a0a]">Termos de Uso</Link></li>
                            <li><Link href="/privacy" className="hover:text-[#0a0a0a]">Privacidade</Link></li>
                            <li><Link href="/lgpd" className="hover:text-[#0a0a0a]">LGPD</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[#e4e1dc] pt-4 text-center text-xs text-[#6f6b76]">
                    <p>&copy; {new Date().getFullYear()} ZapBroker. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}

export function CTA() {
    return (
        <section className="py-14 bg-[#145c3b] text-white relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
                    backgroundSize: '26px 26px',
                }}
            />
            <div className="container relative mx-auto px-4 md:px-6 text-center">
                <DoodleSquiggle className="mx-auto mb-4 w-24 h-6 text-[#d4a054]" />
                <h2 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight">Você Chegou no Fim da Página.</h2>
                <p className="text-sm md:text-base text-white/70 mb-8 max-w-lg mx-auto">
                    Pronto para multiplicar suas captações, fazer mais visitas e fechar mais negócios?
                </p>

                <div className="flex flex-col items-center gap-3">
                    <Link
                        href="#pricing"
                        className="px-8 py-3.5 bg-[#d4a054] text-[#0a0a0a] rounded-full font-black text-sm shadow-lg hover:brightness-110 transition-all transform hover:-translate-y-0.5"
                    >
                        Assinar agora →
                    </Link>
                    <p className="text-xs text-white/50">
                        Pagamento via PIX, ativação imediata, cancele quando quiser
                    </p>
                </div>
            </div>
        </section>
    )
}
