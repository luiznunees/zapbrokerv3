import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"

const ILLUSTRATION_PATH = "/illustrations/agent-chat.svg"

function illustrationExists() {
    try {
        return fs.existsSync(path.join(process.cwd(), "public", ILLUSTRATION_PATH))
    } catch {
        return false
    }
}

export function AgentShowcase() {
    const hasIllustration = illustrationExists()

    return (
        <section className="py-8 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="rounded-2xl bg-gradient-to-br from-brand-green-50 to-brand-green-100/60 dark:from-brand-green-950/40 dark:to-brand-green-900/20 p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center overflow-hidden">
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight mb-3 text-foreground leading-tight">
                            O agente cuida do disparo enquanto você atende cliente
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-md">
                            Você fala o que quer no painel, igual conversa no ChatGPT. O agente monta o disparo, acompanha quem respondeu e te avisa no seu próprio WhatsApp quando algum lead precisa de atenção.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex px-5 py-2.5 rounded-xl bg-brand-green-500 hover:bg-brand-green-600 text-white text-sm font-bold shadow-lg shadow-brand-green-500/20 transition-colors"
                        >
                            Testar Gratuitamente →
                        </Link>
                    </div>

                    {/* Illustration slot — drop the character SVG from Storyset here */}
                    <div className="relative flex items-center justify-center min-h-[220px]">
                        {hasIllustration ? (
                            <Image
                                src={ILLUSTRATION_PATH}
                                alt=""
                                width={420}
                                height={320}
                                className="w-full max-w-sm h-auto"
                            />
                        ) : (
                            <div className="w-full max-w-sm aspect-[4/3] rounded-xl border-2 border-dashed border-brand-green-500/30 flex items-center justify-center text-xs text-muted-foreground text-center px-4">
                                Ilustração pendente — salve em public/illustrations/agent-chat.svg
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
