import { createServerSupabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/utils'

const SITE_URL = 'https://insight.citiplug.com'

export default async function sitemap() {
  const sb = createServerSupabase()

  // Fetch all published articles
  const { data: articles } = await sb.from('inkwell_articles')
    .select('slug, published_at, updated_at, author:profiles!inkwell_articles_author_id_fkey(username)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1000)

  // Fetch all writer profiles
  const { data: writers } = await sb.from('profiles')
    .select('username, updated_at')
    .not('username', 'is', null)
    .limit(500)

  const articleUrls = (articles || []).map(a => ({
    url: `${SITE_URL}/@${a.author?.username || 'writer'}/${a.slug}`,
    lastModified: new Date(a.updated_at || a.published_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryUrls = CATEGORIES.map(c => ({
    url: `${SITE_URL}/topic/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  const writerUrls = (writers || []).map(w => ({
    url: `${SITE_URL}/@${w.username}`,
    lastModified: new Date(w.updated_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    ...categoryUrls,
    ...articleUrls,
    ...writerUrls,
  ]
}
