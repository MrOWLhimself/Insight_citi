export const dynamic = 'force-dynamic'
import { createServerSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import WriterProfileClient from '@/components/profile/WriterProfileClient'

const SITE_URL = 'https://insight.citiplug.com'
const ARTICLE_SELECT = `id, title, slug, cover_image, category, tags, body, published_at, clap_count, comment_count,
  author:profiles!inkwell_articles_author_id_fkey(id, username, full_name, avatar_url)`

export async function generateMetadata({ params }) {
  const username = params.handle.replace('@', '').replace('%40', '')
  const sb = createServerSupabase()
  const { data: writer } = await sb.from('profiles').select('full_name, bio, avatar_url').eq('username', username).maybeSingle()
  if (!writer) return { title: 'Writer not found' }
  return {
    title: `${writer.full_name || username} — Writer on Insight`,
    description: writer.bio || `Read stories by ${writer.full_name || username} on Insight.`,
    openGraph: {
      title: `${writer.full_name || username} on Insight`,
      description: writer.bio || `Stories by ${writer.full_name || username}`,
      images: writer.avatar_url ? [{ url: writer.avatar_url, width: 400, height: 400 }] : [],
      url: `${SITE_URL}/@${username}`,
    },
    alternates: { canonical: `${SITE_URL}/@${username}` },
  }
}

export const revalidate = 300

export default async function WriterPage({ params }) {
  const username = params.handle.replace('@', '').replace('%40', '')
  const sb = createServerSupabase()

  let { data: writer } = await sb.from('profiles').select('*').eq('username', username).maybeSingle()
  
  // Fallback: search by full_name if username not found
  if (!writer) {
    const { data: byName } = await sb.from('profiles')
      .select('*')
      .ilike('full_name', `%${username}%`)
      .limit(1)
      .maybeSingle()
    writer = byName
  }
  
  if (!writer) notFound()

  const { data: articles } = await sb.from('inkwell_articles')
    .select(ARTICLE_SELECT)
    .eq('author_id', writer.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return <WriterProfileClient writer={writer} articles={articles || []} username={username} />
}
