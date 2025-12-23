export function Stats() {
    return (
        <section className="border-y border-border bg-card/50 backdrop-blur-sm relative z-10 -mt-8 md:-mt-12 mx-4 md:mx-auto max-w-3xl rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-2 text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-brand-purple mb-0.5">1,2M</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Mensagens Enviadas</p>
                </div>
                <div className="p-2 text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-brand-purple mb-0.5">+1.247</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Corretores Ativos</p>
                </div>
                <div className="p-2 text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-brand-purple mb-0.5">97%</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Taxa de Entrega</p>
                </div>
            </div>
        </section>
    )
}
