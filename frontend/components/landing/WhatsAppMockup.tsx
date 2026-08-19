import { CheckCheck } from "lucide-react"

export function WhatsAppMockup() {
    return (
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl shadow-black/5 overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-green-600 text-white">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    Z
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold leading-tight">ZapBroker</p>
                    <p className="text-[11px] text-white/70 leading-tight">disparo no seu WhatsApp</p>
                </div>
            </div>

            {/* Chat body */}
            <div
                className="p-4 space-y-3 min-h-[280px]"
                style={{
                    backgroundColor: '#e9edef',
                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)',
                    backgroundSize: '14px 14px',
                }}
            >
                {/* Dispatch finished notification */}
                <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                        <p className="text-[13px] text-zinc-800 leading-snug">
                            ✅ Disparo <strong>"Vila Mariana"</strong> finalizado.<br />45/130 leads visualizaram.
                        </p>
                        <span className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 mt-1">
                            14:02 <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                        </span>
                    </div>
                </div>

                {/* New dispatch confirmation */}
                <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                        <p className="text-[13px] text-zinc-800 leading-snug">
                            📤 Disparo <strong>"Cobertura Pinheiros"</strong> agendado para 130 leads.
                        </p>
                        <span className="block text-right text-[10px] text-zinc-400 mt-1">14:03</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="bg-brand-green-500/10 text-brand-green-700 dark:text-brand-green-400 text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                        Uma mensagem, toda a lista
                    </div>
                </div>
            </div>
        </div>
    )
}
