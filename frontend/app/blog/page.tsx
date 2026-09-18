import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BlogHeader } from "@/components/blog/BlogHeader"
import { Footer } from "@/components/landing/Footer"
import { getPublishedPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog",
  description: "Guias práticos de WhatsApp em massa pra corretor de imóveis: como não ser banido, preço de ferramentas, aquecimento de chip e mais.",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function BlogIndexPage() {
  const posts = getPublishedPosts()

  return (
    <div className="min-h-screen bg-white">
      <BlogHeader />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-landing-navy mb-3">
            Blog do ZapBroker
          </h1>
          <p className="text-muted-foreground text-lg">
            Guias diretos sobre WhatsApp em massa pra corretor de imóveis — sem enrolação, sem jargão.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border-b border-border pb-8 last:border-0"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                  {formatDate(post.publishedAt)}
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-landing-navy mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">{post.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Ler artigo <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
