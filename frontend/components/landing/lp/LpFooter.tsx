import Link from "next/link"
import { BrandLogo } from "@/components/BrandLogo"

export function LpFooter() {
    return (
        <footer className="bg-landing-navy py-6">
            <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <BrandLogo className="h-5 w-auto text-white" monochrome />
                <div className="flex items-center gap-4 text-xs text-white/40">
                    <Link href="/terms" className="hover:text-landing-lime">Termos</Link>
                    <Link href="/privacy" className="hover:text-landing-lime">Privacidade</Link>
                    <span>&copy; {new Date().getFullYear()} ZapBroker</span>
                </div>
            </div>
        </footer>
    )
}
