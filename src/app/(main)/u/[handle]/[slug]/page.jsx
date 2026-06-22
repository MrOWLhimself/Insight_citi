export const dynamic = 'force-dynamic'
import { createServerSupabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { getCategoryLabel, getCategoryColor, extractText, readTime, timeAgo } from '@/lib/utils'
import ArticleClientShell from '@/components/article/ArticleClientShell'

const SITE_URL = 'https://insight.citiplug.com'

const ARTICLE_SELECT = `id, title, slug, cover_image, category, tags, body, published_at, updated_at, clap_count, comment_count, view_count, author_id,
  author:profiles!inkwell_articles_author_id_fkey(id, username, full_name, avatar_url, bio, follower_count)`

// ── generateMetadata — THIS is why we need Next.js ──
export async function generateMetadata({ params }) {
  const { handle: username, slug } = params
  const realUsername = username.replace('%40', '').replace('@', '')

  const sb = createServerSupabase()
  const { data: article } = await sb.from('inkwell_articles')
    .select(`title, cover_image, category, published_at, body,
      author:profiles!inkwell_articles_author_id_fkey(full_name, username)`)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) return { title: 'Story not found' }

  const excerpt = extractText(article.body)
  const authorName = article.author?.full_name || realUsername
  const authorUsername = article.author?.username || realUsername
  const articleUrl = `${SITE_URL}/@${authorUsername}/${slug}`
  const ogImage = article.cover_image || `${SITE_URL}/og-default.jpg`
  const rt = readTime(article.body)

  // Article JSON-LD schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: excerpt,
    image: ogImage,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `${SITE_URL}/@${authorUsername}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Insight',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    articleSection: getCategoryLabel(article.category),
    keywords: article.tags?.join(', ') || '',
    timeRequired: `PT${parseInt(rt)}M`,
  }

  return {
    title: article.title,
    description: excerpt || `Read "${article.title}" by ${authorName} on Insight.`,
    authors: [{ name: authorName }],
    openGraph: {
      type: 'article',
      title: article.title,
      description: excerpt,
      url: articleUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      publishedTime: article.published_at,
      authors: [authorName],
      section: getCategoryLabel(article.category),
      tags: article.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: excerpt,
      images: [ogImage],
    },
    alternates: { canonical: articleUrl },
    other: {
      'article:author': authorName,
      'article:published_time': article.published_at,
      'article:section': getCategoryLabel(article.category),
    },
  }
}



export const revalidate = 300 // Revalidate every 5 mins

export default async function ArticlePage({ params }) {
  const { handle: username, slug } = params
  const sb = createServerSupabase()

  const { data: article } = await sb.from('inkwell_articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  const { data: comments } = await sb.from('inkwell_comments')
    .select('*, author:profiles!inkwell_comments_user_id_fkey(id, username, full_name, avatar_url)')
    .eq('article_id', article.id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(50)

  const authorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: article.author?.full_name || username,
    url: `${SITE_URL}/@${article.author?.username || username}`,
    image: article.author?.avatar_url,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }} />
      <ArticleClientShell article={article} comments={comments || []} />
    </>
  )
}
