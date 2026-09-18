import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BlogHeader } from "@/components/blog/BlogHeader"
import { Footer } from "@/components/landing/Footer"
import { getPostBySlug, getPublishedPosts } from "@/lib/blog"

const SITE_URL = "https://zapbroker.dev"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "ZapBroker", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  }

  return (
    <div className="min-h-screen bg-white">
      <BlogHeader />

      {post.draft && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 text-center text-sm font-bold py-2">
          Rascunho — não indexado, visível só por link direto.
        </div>
      )}

      <article className="max-w-2xl mx-auto px-4 md:px-6 py-16">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="size-3.5" /> Voltar pro blog
        </Link>

        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
          {formatDate(post.publishedAt)}
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-landing-navy mb-8 leading-tight">
          {post.title}
        </h1>

        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-landing-navy prose-a:text-primary prose-a:font-semibold"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Footer />
    </div>
  )
}
