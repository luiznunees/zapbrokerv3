import { Star } from "lucide-react"

const AVATAR_COLORS = ["bg-landing-sky/30", "bg-indigo-200", "bg-landing-sky/40", "bg-indigo-300"]

export function LpProof() {
    return (
        <section className="py-10 bg-white">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 rounded-2xl bg-landing-navy px-6 py-5 text-center sm:text-left">
                    <div className="flex -space-x-2 shrink-0">
                        {AVATAR_COLORS.map((color, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-landing-navy ${color}`} />
                        ))}
                    </div>
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-0.5 mb-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-landing-lime text-landing-lime" />
                            ))}
                        </div>
                        <p className="text-sm font-bold text-white">+2.500 corretores já usam o ZapBroker</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
