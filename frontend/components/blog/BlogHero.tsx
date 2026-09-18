import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { BlogPostMeta } from "@/lib/blog"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export function BlogHero({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative block overflow-hidden rounded-[32px] bg-landing-navy px-6 py-10 md:px-14 md:py-16 mb-12"
    >
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-landing-sky/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 size-56 rounded-full bg-landing-lime/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-landing-lime mb-4">
          Guia · {formatDate(post.publishedAt)}
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          {post.title}
        </h2>
        <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8">
          {post.description}
        </p>
        <span className="inline-flex items-center gap-2 pl-5 pr-2 py-2 bg-landing-lime text-landing-navy rounded-full font-extrabold text-sm group-hover:bg-landing-lime-dark transition-colors">
          Ler artigo completo
          <span className="flex items-center justify-center size-6 rounded-full bg-landing-navy text-landing-lime">
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  )
}
