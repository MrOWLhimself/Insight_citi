import { createServerSupabase } from '@/lib/supabase'
import ArticleCard from '@/components/article/ArticleCard'
import Link from 'next/link'

const SITE_URL = 'https://insight.citiplug.com'
const ARTICLE_SELECT = `id, title, slug, cover_image, category, tags, body, published_at, clap_count, comment_count,
  author:profiles!inkwell_articles_author_id_fkey(id, username, full_name, avatar_url)`

export async function generateMetadata({ params }) {
  const { tag } = params
  return {
    title: `#${tag} Stories`,
    description: `Stories tagged #${tag} on Insight.`,
    alternates: { canonical: `${SITE_URL}/tag/${tag}` },
  }
}

export const revalidate = 120

export default async function TagPage({ params }) {
  const { tag } = params
  const sb = createServerSupabase()
  const { data: articles } = await sb.from('inkwell_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .contains('tags', [tag])
    .order('published_at', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Tag</p>
        <h1 style={{ fontFamily: 'Lora, serif' }} className="text-3xl font-bold text-ink-900">#{tag}</h1>
      </div>
      {!articles?.length ? (
        <p className="text-center py-16 text-gray-400">No stories with #{tag} yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {articles.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  )
}
