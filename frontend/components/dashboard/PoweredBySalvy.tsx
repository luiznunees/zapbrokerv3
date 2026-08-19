// Assinatura obrigatória de branding da Salvy para integrações via API/webhooks.
// Regras (docs.salvy.com.br/api-reference/branding):
// - Sempre "powered by" (minúsculo, fonte Inter) + logo oficial da Salvy
// - Nunca escrever "Salvy" em texto — sempre usar o logo
// - Tamanho mínimo horizontal: 195 x 49px
// - Asset oficial: /public/salvy-logo.svg
export function PoweredBySalvy({ className }: { className?: string }) {
    return (
        <div className={`inline-flex items-center gap-2 ${className || ''}`}>
            <span
                className="text-[11px] text-[#CBCBCB] font-normal lowercase leading-none"
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                powered by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/salvy-logo.svg"
                alt="Salvy"
                className="h-[22px] w-auto object-contain"
                style={{ minHeight: "22px" }}
            />
        </div>
    )
}