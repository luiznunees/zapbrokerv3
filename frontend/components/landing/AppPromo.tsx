import Link from "next/link"
import { Smartphone, ArrowUpRight } from "lucide-react"

export function AppPromo() {
    return (
        <section className="py-10 md:py-14 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6 rounded-3xl border border-landing-navy/10 bg-landing-mist p-6 md:p-8">
                    <span className="flex items-center justify-center size-14 rounded-2xl bg-landing-navy text-landing-lime shrink-0">
                        <Smartphone className="size-6" />
                    </span>

                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-display text-lg md:text-xl font-bold text-landing-navy">
                            Também temos app
                        </h3>
                        <p className="text-sm text-landing-navy/60">
                            Instale o ZapBroker no seu celular ou computador e tenha o painel sempre à mão, sem precisar abrir o navegador.
                        </p>
                    </div>

                    <Link
                        href="/dashboard"
                        className="group shrink-0 flex items-center gap-2 pl-5 pr-2 py-2.5 rounded-full bg-landing-lime hover:bg-landing-lime-dark text-landing-navy text-sm font-bold transition-colors"
                    >
                        Baixar o app
                        <span className="flex items-center justify-center size-6 rounded-full bg-landing-navy text-landing-lime group-hover:rotate-45 transition-transform">
                            <ArrowUpRight className="size-3.5" />
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    )
}
