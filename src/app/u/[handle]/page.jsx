import { createServerSupabase } from '@/lib/supabase-server'
import { slugifyAuthor, timeAgo } from '@/lib/schema'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

export default async function WriterProfile({ params }) {
  const sb = createServerSupabase()
  const handle = params.handle

  // Reconstruct name from slug and find profile
  const name = handle.replace(/-/g, ' ').replace(/\w/g, c => c.toUpperCase())
  const { data: profile } = await sb.from('profiles')
    .select('id, full_name, avatar_url, bio')
    .ilike('full_name', name)
    .maybeSingle()

  if (!profile) notFound()

  // Fetch posts using real columns
  const { data: postsRaw } = await sb.from('insight_posts')
    .select(`
      id, title, slug, cover_image_url, published_at,
      category:insight_categories!insight_posts_category_fkey(name, slug)
    `)
    .eq('author_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  const posts = postsRaw || []

  // Get view counts for each post
  let viewCounts = {}
  if (posts.length) {
    const { data: views } = await sb.from('insight_views').select('post_id').in('post_id', posts.map(p => p.id))
    if (views) views.forEach(v => { viewCounts[v.post_id] = (viewCounts[v.post_id] || 0) + 1 })
  }

  const initials = (profile.full_name || 'W').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'40px 16px 80px' }}>
      {/* Author header */}
      <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:36, paddingBottom:32, borderBottom:'1px solid var(--line)' }}>
        {profile.avatar_url
          ? <img src={profile.avatar_url} style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--line)', flexShrink:0 }} />
          : <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--orange-soft)', border:'2px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--display)', fontWeight:800, fontSize:26, color:'var(--orange)', flexShrink:0 }}>{initials}</div>
        }
        <div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:26, fontWeight:950, letterSpacing:'-.04em', marginBottom:6 }}>
            {profile.full_name || name}
          </h1>
          {profile.bio && (
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.65, maxWidth:500 }}>{profile.bio}</p>
          )}
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:10 }}>{posts.length} articles</p>
        </div>
      </div>

      {/* Posts list */}
      {posts.length === 0
        ? <div style={{ textAlign:'center', padding:'48px 0' }}><p style={{ color:'var(--muted)' }}>No published stories yet.</p></div>
        : <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {posts.map(p => (
              <Link key={p.id} href={'/u/' + handle + '/' + p.slug}
                style={{ display:'flex', gap:16, textDecoration:'none', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  {p.category && <span className="kicker" style={{ textDecoration:'none' }}>{p.category.name}</span>}
                  <h2 style={{ fontFamily:'var(--display)', fontSize:20, fontWeight:800, color:'var(--ink)', lineHeight:1.25, margin:'5px 0 8px', letterSpacing:'-.03em' }}>
                    {p.title}
                  </h2>
                  <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--muted)', fontWeight:700 }}>
                    <span>{timeAgo(p.published_at)}</span>
                    <span>{(viewCounts[p.id] || 0).toLocaleString()} views</span>
                  </div>
                </div>
                {p.cover_image_url && (
                  <div style={{ width:100, height:76, borderRadius:14, overflow:'hidden', flexShrink:0 }}>
                    <img src={p.cover_image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                )}
              </Link>
            ))}
          </div>
      }
    </div>
  )
}