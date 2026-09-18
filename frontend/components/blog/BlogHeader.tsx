import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { BrandLogo } from "@/components/BrandLogo"

// Header próprio do blog em vez de reaproveitar o <Header> da landing — aquele é
// transparente até rolar a página (assume o hero escuro logo abaixo); numa página de
// conteúdo sem hero, texto branco em bg-transparent ficaria ilegível sobre fundo claro.
export function BlogHeader() {
  return (
    <header className="w-full bg-landing-navy border-b border-white/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo className="h-6 w-auto text-white" monochrome />
            <span className="text-xs font-bold uppercase tracking-widest text-white/50 border-l border-white/20 pl-2.5">Blog</span>
          </Link>

          <Link
            href="/assinar"
            className="hidden sm:flex items-center gap-2 pl-4 pr-2 py-1.5 bg-landing-lime text-landing-navy rounded-full font-bold text-xs hover:bg-landing-lime-dark transition-colors"
          >
            Assinar agora
            <span className="flex items-center justify-center size-5 rounded-full bg-landing-navy text-landing-lime">
              <ArrowUpRight className="size-3" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
