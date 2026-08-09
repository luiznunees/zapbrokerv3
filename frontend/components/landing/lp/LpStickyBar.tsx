import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { WHATSAPP_CTA_URL } from "./constants"

// CTA fixo só no mobile — é de onde vem a maior parte do tráfego pago via Instagram/Meta Ads.
export function LpStickyBar() {
    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 p-3 bg-white/95 backdrop-blur-md border-t border-landing-navy/10">
            <Link
                href={WHATSAPP_CTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-landing-lime text-landing-navy rounded-full font-black text-sm"
            >
                <MessageCircle className="size-4" />
                Falar no WhatsApp agora
            </Link>
        </div>
    )
}
