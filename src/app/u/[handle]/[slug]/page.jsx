import { createServerSupabase } from '@/lib/supabase-server'
import { contentToHtml, contentToText, slugifyAuthor, timeAgo, readTime } from '@/lib/schema'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ArticleActions from './ArticleActions'

export async function generateMetadata({ params }) {
  const sb = createServerSupabase()
  const { data } = await sb.from('insight_posts')
    .select('title, cover_image_url, seo_title, seo_description, author:profiles!insight_posts_author_id_fkey(full_name)')
    .eq('slug', params.slug).maybeSingle()
  if (!data) return { title: 'Not Found' }
  return {
    title: (data.seo_title || data.title) + ' — Insight',
    description: data.seo_description || ('By ' + (data.author?.full_name || 'Anonymous')),
    openGraph: { title: data.seo_title || data.title, images: data.cover_image_url ? [data.cover_image_url] : [] }
  }
}

export const revalidate = 60

export default async function ArticlePage({ params }) {
  const sb = createServerSupabase()

  const { data: post } = await sb.from('insight_posts')
    .select(`
      id, title, slug, content, cover_image_url,
      status, published_at, created_at, author_id,
      seo_title, seo_description, canonical_url,
      category:insight_categories!insight_posts_category_fkey(id, name, slug),
      author:profiles!insight_posts_author_id_fkey(id, full_name, avatar_url, bio)
    `)
    .eq('slug', params.slug)
    .maybeSingle()

  if (!post) notFound()

  // Fetch tags via insight_post_tags → insight_tags
  const { data: postTags } = await sb
    .from('insight_post_tags')
    .select('tag:insight_tags!insight_post_tags_tag_id_fkey(id, name, slug)')
    .eq('post_id', post.id)

  const tags = (postTags || []).map(pt => pt.tag).filter(Boolean)

  // Count views from insight_views
  const { count: viewCount } = await sb
    .from('insight_views')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  // Count reactions from insight_reactions
  const { count: reactionCount } = await sb
    .from('insight_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  // More by same author
  const { data: morePosts } = await sb.from('insight_posts')
    .select('id, title, slug, cover_image_url, published_at')
    .eq('author_id', post.author_id)
    .eq('status', 'published')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3)

  const bodyHtml = contentToHtml(post.content)
  const authorHandle = slugifyAuthor(post.author?.full_name)
  const postUrl = 'https://insight.citiplug.com/u/' + authorHandle + '/' + post.slug

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 16px 80px' }}>
      <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--muted)', textDecoration:'none', fontSize:13, fontWeight:600, marginBottom:24 }}>
        <ArrowLeft size={14} /> Back
      </Link>

      {/* Category */}
      {post.category && (
        <div style={{ marginBottom:12 }}>
          <Link href={`/topic/${post.category.slug}`} className="kicker" style={{ textDecoration:'none', background:'var(--orange-soft)', padding:'4px 12px', borderRadius:99 }}>
            {post.category.name}
          </Link>
        </div>
      )}

      {/* Title */}
      <h1 style={{ fontFamily:'var(--display)', fontSize:'clamp(28px,5vw,46px)', fontWeight:950, color:'var(--ink)', lineHeight:1.1, letterSpacing:'-.04em', marginBottom:20 }}>
        {post.title}
      </h1>

      {/* Byline */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28, flexWrap:'wrap' }}>
        {post.author?.avatar_url && (
          <img src={post.author.avatar_url} style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--line)' }} />
        )}
        <div>
          <Link href={'/u/' + authorHandle} style={{ fontWeight:800, fontSize:15, color:'var(--ink)', textDecoration:'none' }}>
            {post.author?.full_name || 'Anonymous'}
          </Link>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
            {post.published_at ? new Date(post.published_at).toLocaleDateString('en-NG', { year:'numeric', month:'long', day:'numeric' }) : 'Unpublished'}
            {' · '}
            {readTime(post.content)}
            {' · '}
            {(viewCount || 0).toLocaleString()} views
          </p>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <ArticleActions
            postId={post.id}
            reactionCount={reactionCount || 0}
            url={postUrl}
            title={post.title}
            excerpt={post.excerpt || contentToText(post.content).slice(0,200)}
            coverImageUrl={post.cover_image_url || ''}
            categoryName={post.category?.name || 'Insight'}
          />
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image_url && (
        <div style={{ borderRadius:20, overflow:'hidden', marginBottom:32, maxHeight:500 }}>
          <img src={post.cover_image_url} alt={post.title} style={{ width:'100%', objectFit:'cover' }} />
        </div>
      )}

      {/* Excerpt */}


      {/* Body — rendered from jsonb content */}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ marginTop:32, display:'flex', gap:8, flexWrap:'wrap' }}>
          {tags.map(tag => (
            <Link key={tag.id} href={`/tag/${tag.slug}`} style={{ padding:'5px 12px', border:'1px solid var(--line)', borderRadius:99, fontSize:12, fontWeight:700, textDecoration:'none', color:'var(--muted)' }}>
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Author bio */}
      {post.author && (
        <div style={{ marginTop:48, padding:24, background:'var(--orange-soft)', borderRadius:20, border:'1px solid #fed7aa' }}>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            {post.author.avatar_url && (
              <img src={post.author.avatar_url} style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
            )}
            <div>
              <p style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{post.author.full_name}</p>
              {post.author.bio && <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>{post.author.bio}</p>}
              <Link href={'/u/' + authorHandle} style={{ display:'inline-block', marginTop:10, color:'var(--orange)', fontWeight:700, fontSize:13, textDecoration:'none' }}>
                More by this writer →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* More by author */}
      {morePosts && morePosts.length > 0 && (
        <div style={{ marginTop:40 }}>
          <h2 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:800, marginBottom:16, letterSpacing:'-.03em' }}>
            More by {post.author?.full_name?.split(' ')[0]}
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {morePosts.map(p => (
              <Link key={p.id} href={'/u/' + authorHandle + '/' + p.slug}
                style={{ display:'flex', gap:12, textDecoration:'none', background:'#fff', border:'1px solid var(--line)', borderRadius:14, overflow:'hidden', alignItems:'center' }}>
                {p.cover_image_url && (
                  <div style={{ width:80, height:70, flexShrink:0, overflow:'hidden' }}>
                    <img src={p.cover_image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                )}
                <div style={{ padding:'12px 12px 12px 0', flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:13, color:'var(--ink)', lineHeight:1.35 }}>{p.title}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{timeAgo(p.published_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}