import { createServerSupabase } from '@/lib/supabase-server'
import { slugifyAuthor, timeAgo, contentToText } from '@/lib/schema'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const revalidate = 60

export async function generateMetadata({ params }) {
  const name = params.slug.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())
  return { title: name + ' — Insight', description: 'Stories and articles in the ' + name + ' category on Insight.' }
}

export default async function TopicPage({ params }) {
  const sb = createServerSupabase()
  const catSlug = params.slug

  // Try to find the category in insight_categories first
  const { data: category } = await sb.from('insight_categories')
    .select('id, name, slug, description')
    .eq('slug', catSlug)
    .maybeSingle()

  let posts = []
  if (category) {
    // Category found — join on uuid FK
    const { data } = await sb.from('insight_posts')
      .select(`
        id, title, slug, excerpt, content, cover_image_url,
        published_at, author_id,
        category:insight_categories!insight_posts_category_fkey(name, slug),
        author:profiles!insight_posts_author_id_fkey(full_name, avatar_url)
      `)
      .eq('status', 'published')
      .eq('category', category.id)
      .order('published_at', { ascending: false })
      .limit(30)
    posts = data || []
  } else {
    // No category row — fall back to tag search via insight_post_tags
    const { data: tagRow } = await sb.from('insight_tags').select('id').eq('slug', catSlug).maybeSingle()
    if (tagRow) {
      const { data: postTagRows } = await sb.from('insight_post_tags')
        .select('post_id').eq('tag_id', tagRow.id)
      const ids = (postTagRows || []).map(r => r.post_id)
      if (ids.length) {
        const { data } = await sb.from('insight_posts')
          .select(`
            id, title, slug, excerpt, content, cover_image_url,
            published_at, author_id,
            category:insight_categories!insight_posts_category_fkey(name, slug),
            author:profiles!insight_posts_author_id_fkey(full_name, avatar_url)
          `)
          .in('id', ids)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(30)
        posts = data || []
      }
    }
  }

  const displayName = (category?.name || catSlug).replace(/-/g,' ').replace(/\w/g, c => c.toUpperCase())
  const [hero, ...rest] = posts
  const fallback = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1400'

  return (
    <div>
      <section style={{ background:'#222222', color:'#fff', borderBottom:'5px solid var(--orange)' }}>
        <div className="container" style={{ padding:'54px 0 44px' }}>
          <p className="kicker" style={{ color:'var(--orange)' }}>Insight Category</p>
          <h1 className="section-title" style={{ fontSize:'clamp(44px,7vw,82px)', lineHeight:.92, textTransform:'capitalize', margin:'10px 0' }}>
            {displayName}
          </h1>
          {category?.description && (
            <p style={{ color:'#d8d0c2', fontSize:17, lineHeight:1.7, maxWidth:720 }}>{category.description}</p>
          )}
        </div>
      </section>

      <main className="container" style={{ padding:'34px 0 80px' }}>
        {posts.length === 0 ? (
          <div style={{ padding:'70px 0', textAlign:'center' }}>
            <h2 className="section-title" style={{ fontSize:38 }}>No stories yet.</h2>
            <p style={{ color:'var(--muted)', margin:'10px 0 20px' }}>
              Be the first contributor to publish under {displayName}.
            </p>
            <Link className="btn btn-dark" href="/write">Write for {displayName}</Link>
          </div>
        ) : (
          <>
            {/* Hero + sidebar */}
            <div style={{ display:'grid', gridTemplateColumns:'1.1fr .9fr', gap:24, marginBottom:34 }}>
              {hero && (
                <Link className="article-card premium-card" href={'/u/' + slugifyAuthor(hero.author?.full_name) + '/' + hero.slug} style={{ borderRadius:28, overflow:'hidden' }}>
                  <div className="image-wrap" style={{ height:360 }}>
                    <img src={hero.cover_image_url || fallback} alt={hero.title} />
                  </div>
                  <div style={{ padding:24 }}>
                    <p className="kicker">Lead story</p>
                    <h2 className="section-title" style={{ fontSize:30, lineHeight:1.05, margin:'8px 0 12px', letterSpacing:'-.04em' }}>{hero.title}</h2>
                    <p style={{ color:'var(--muted)', lineHeight:1.65 }}>
                      {(hero.excerpt || contentToText(hero.content)).slice(0, 150)}...
                    </p>
                  </div>
                </Link>
              )}
              <div style={{ display:'grid', gap:14 }}>
                {rest.slice(0, 4).map(p => (
                  <Link className="article-card premium-card" key={p.id} href={'/u/' + slugifyAuthor(p.author?.full_name) + '/' + p.slug}
                    style={{ borderRadius:22, padding:16, display:'grid', gridTemplateColumns:'96px 1fr', gap:14 }}>
                    <div className="image-wrap" style={{ height:84, borderRadius:16 }}>
                      {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} />}
                    </div>
                    <div>
                      <p className="kicker">{timeAgo(p.published_at)}</p>
                      <h3 style={{ fontFamily:'var(--display)', fontSize:17, lineHeight:1.15, letterSpacing:'-.03em', marginTop:6 }}>{p.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Rest */}
            {rest.slice(4).length > 0 && (
              <div style={{ borderTop:'3px solid var(--ink)', paddingTop:20, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
                {rest.slice(4).map(p => (
                  <Link className="article-card premium-card" key={p.id} href={'/u/' + slugifyAuthor(p.author?.full_name) + '/' + p.slug}
                    style={{ borderRadius:22, overflow:'hidden' }}>
                    <div className="image-wrap" style={{ height:170 }}>
                      {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} />}
                    </div>
                    <div style={{ padding:18 }}>
                      <p className="kicker">{p.author?.full_name || 'Insight Desk'}</p>
                      <h3 style={{ fontFamily:'var(--display)', fontSize:19, lineHeight:1.15, letterSpacing:'-.03em', margin:'8px 0' }}>{p.title}</h3>
                      <p style={{ fontSize:12, color:'var(--muted)', fontWeight:800 }}>
                        {timeAgo(p.published_at)} <ArrowRight size={11} style={{ verticalAlign:'middle' }} />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}