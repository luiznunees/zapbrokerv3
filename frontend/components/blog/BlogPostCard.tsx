import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { BlogPostMeta } from "@/lib/blog"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export function BlogPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white border border-landing-navy/10 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-landing-sky mb-3">
        {formatDate(post.publishedAt)}
      </p>
      <h3 className="font-display text-lg font-bold text-landing-navy mb-2 leading-snug group-hover:text-landing-sky transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-landing-navy/60 leading-relaxed mb-4 flex-1">{post.description}</p>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-landing-navy">
        Ler artigo <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
