import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { marked } from "marked"

const BLOG_DIR = path.join(process.cwd(), "content", "blog")

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  publishedAt: string
  author: string
  keywords: string[]
  draft: boolean
}

export interface BlogPost extends BlogPostMeta {
  html: string
}

function listMarkdownFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"))
}

function readMeta(filename: string): BlogPostMeta {
  const slug = filename.replace(/\.md$/, "")
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8")
  const { data } = matter(raw)
  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    publishedAt: data.publishedAt || new Date().toISOString().slice(0, 10),
    author: data.author || "ZapBroker",
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    draft: !!data.draft,
  }
}

// Só posts publicados (draft: false) — usado na listagem pública e no sitemap.
export function getPublishedPosts(): BlogPostMeta[] {
  return listMarkdownFiles()
    .map(readMeta)
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

// Inclui drafts — pra dar pra revisar pelo link direto antes de flipar draft: false.
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(raw)
  const html = marked.parse(content, { async: false }) as string

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    publishedAt: data.publishedAt || new Date().toISOString().slice(0, 10),
    author: data.author || "ZapBroker",
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    draft: !!data.draft,
    html,
  }
}

export function getAllSlugsIncludingDrafts(): string[] {
  return listMarkdownFiles().map((f) => f.replace(/\.md$/, ""))
}
