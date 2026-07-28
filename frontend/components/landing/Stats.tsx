const STATS = [
    { value: "2.500+", label: "corretores ativos" },
    { value: "4.9/5.0", label: "avaliação média" },
    { value: "<2min", label: "para ativar" },
]

export function Stats() {
    return (
        <div className="bg-[#145c3b] pb-10 -mt-1">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-wrap justify-center gap-3">
                    {STATS.map((stat, i) => (
                        <div
                            key={i}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-sm shadow-lg"
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0e9f6e]" />
                            </span>
                            <span className="font-black text-[#0a0a0a]">{stat.value}</span>
                            <span className="text-[#6f6b76] font-medium">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
