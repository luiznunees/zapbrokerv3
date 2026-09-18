import type { Metadata } from "next"
import { BlogHeader } from "@/components/blog/BlogHeader"
import { BlogHero } from "@/components/blog/BlogHero"
import { BlogPostCard } from "@/components/blog/BlogPostCard"
import { Footer } from "@/components/landing/Footer"
import { getPublishedPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Blog",
  description: "Guias práticos de WhatsApp em massa pra corretor de imóveis: como não ser banido, preço de ferramentas, aquecimento de chip e mais.",
}

export default function BlogIndexPage() {
  const [featured, ...rest] = getPublishedPosts()

  return (
    <div className="min-h-screen bg-white">
      <BlogHeader />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="mb-10 md:mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-landing-navy mb-3">
            Blog do ZapBroker
          </h1>
          <p className="text-landing-navy/60 text-base md:text-lg">
            Guias diretos sobre WhatsApp em massa pra corretor de imóveis — sem enrolação, sem jargão.
          </p>
        </div>

        {!featured ? (
          <p className="text-landing-navy/60">Nenhum artigo publicado ainda.</p>
        ) : (
          <>
            <BlogHero post={featured} />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
              {rest.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center text-center border border-dashed border-landing-navy/15 rounded-2xl p-10 bg-landing-mist/50">
                  <p className="text-xs font-bold text-landing-navy/40 uppercase tracking-widest mb-1">Em breve</p>
                  <p className="text-sm text-landing-navy/50">Mais guias chegando toda semana.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
