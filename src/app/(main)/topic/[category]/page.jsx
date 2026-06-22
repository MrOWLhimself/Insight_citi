import { createServerSupabase } from '@/lib/supabase'
import { getCategoryLabel, CATEGORIES } from '@/lib/utils'
import ArticleCard from '@/components/article/ArticleCard'
import Link from 'next/link'

const SITE_URL = 'https://insight.citiplug.com'
const ARTICLE_SELECT = `id, title, slug, cover_image, category, tags, body, published_at, clap_count, comment_count,
  author:profiles!inkwell_articles_author_id_fkey(id, username, full_name, avatar_url)`

export async function generateMetadata({ params }) {
  const { category } = params
  const label = getCategoryLabel(category)
  return {
    title: `${label} Stories`,
    description: `Read the latest ${label} stories on Insight — an open publishing platform for African writers.`,
    openGraph: {
      title: `${label} — Insight`,
      description: `Read the latest ${label} stories from African writers.`,
      url: `${SITE_URL}/topic/${category}`,
    },
    alternates: { canonical: `${SITE_URL}/topic/${category}` },
  }
}

export async function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.slug }))
}

export const revalidate = 120

export default async function TopicPage({ params }) {
  const { category } = params
  const label = getCategoryLabel(category)
  const sb = createServerSupabase()

  const { data: articles } = await sb.from('inkwell_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Topic</p>
        <h1 style={{ fontFamily: 'Lora, serif' }} className="text-3xl font-bold text-ink-900">{label}</h1>
        <p className="text-sm text-gray-400 mt-1">{articles?.length || 0} stories</p>
      </div>
      {!articles?.length ? (
        <div className="text-center py-20 text-gray-400">
          <p style={{ fontFamily: 'Lora, serif' }} className="text-xl mb-3">No stories in {label} yet</p>
          <Link href="/write" className="text-sm text-orange-500 hover:underline">Write the first one</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {articles.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  )
}
