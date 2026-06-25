'use client'
import React, { useState } from 'react'
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Heart, Edit2, Trash2, PenLine, FileText, TrendingUp, Clock, CheckCircle2, Sparkles, BarChart3, Bookmark } from 'lucide-react'
import { timeAgo } from '@/lib/schema'

function DashboardContent() {
  const { user, profile, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()

  // Fetch my posts — real columns
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['my-insight-posts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('insight_posts')
        .select(`
          id, title, slug, cover_image_url, status, published_at, created_at,
          category:insight_categories!insight_posts_category_fkey(name, slug)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  // Fetch view counts from insight_views
  const { data: viewData = {} } = useQuery({
    queryKey: ['my-post-views', user?.id],
    queryFn: async () => {
      if (!posts.length) return {}
      const ids = posts.map(p => p.id)
      const { data } = await supabase.from('insight_views').select('post_id').in('post_id', ids)
      const counts = {}
      if (data) data.forEach(v => { counts[v.post_id] = (counts[v.post_id]||0)+1 })
      return counts
    },
    enabled: posts.length > 0,
  })

  // Fetch reaction counts from insight_reactions
  const { data: reactionData = {} } = useQuery({
    queryKey: ['my-post-reactions', user?.id],
    queryFn: async () => {
      if (!posts.length) return {}
      const ids = posts.map(p => p.id)
      const { data } = await supabase.from('insight_reactions').select('post_id').in('post_id', ids)
      const counts = {}
      if (data) data.forEach(r => { counts[r.post_id] = (counts[r.post_id]||0)+1 })
      return counts
    },
    enabled: posts.length > 0,
  })

  const del = async id => {
    if (!confirm('Delete this article?')) return
    // Also clean up tags
    await supabase.from('insight_post_tags').delete().eq('post_id', id)
    await supabase.from('insight_posts').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['my-insight-posts'] })
  }

  const togglePublish = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    await supabase.from('insight_posts').update({
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : null
    }).eq('id', post.id)
    qc.invalidateQueries({ queryKey: ['my-insight-posts'] })
  }

  if (loading) return <div style={{ padding:80, textAlign:'center' }}>Loading dashboard...</div>
  if (!isAuthenticated) return (
    <div className="container" style={{ padding:'80px 0', textAlign:'center' }}>
      <h1 className="section-title" style={{ fontSize:42 }}>Contributor access.</h1>
      <p style={{ color:'var(--muted)', margin:'10px 0 22px' }}>Sign in to manage your stories.</p>
      <Link className="btn btn-dark" href="/login">Sign in</Link>
    </div>
  )

  const totalViews     = Object.values(viewData).reduce((s, v) => s + v, 0)
  const totalReactions = Object.values(reactionData).reduce((s, v) => s + v, 0)
  const published      = posts.filter(p => p.status === 'published').length
  const drafts         = posts.filter(p => p.status !== 'published').length
  const top            = [...posts].sort((a,b) => (viewData[b.id]||0) - (viewData[a.id]||0))[0]

  return (
    <div className="container" style={{ padding:'34px 0 80px' }}>
      {/* Hero panel */}
      <div style={{ borderRadius:32, padding:34, background:'linear-gradient(135deg,#222,#2f2f2f)', color:'#fff', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:-60, top:-60, width:220, height:220, borderRadius:'50%', background:'rgba(242,106,33,.2)' }} />
        <p className="kicker" style={{ color:'var(--orange)' }}>Contributor Studio</p>
        <div style={{ display:'flex', justifyContent:'space-between', gap:20, alignItems:'flex-end', flexWrap:'wrap', position:'relative' }}>
          <div>
            <h1 className="section-title" style={{ fontSize:'clamp(34px,5vw,56px)', lineHeight:.95, margin:'10px 0', color:'#fff' }}>
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Writer'}.
            </h1>
            <p style={{ color:'#d8d0c2', fontSize:16, lineHeight:1.65, maxWidth:580 }}>
              Manage drafts, publish stories, track views and build your writer authority on Insight.
            </p>
          </div>
          <Link href="/write" className="btn btn-orange" style={{ fontSize:14 }}>
            <PenLine size={16} /> New story
          </Link>
        </div>
      </div>

      <div className="dash-grid">
        {/* Sidebar */}
        <aside>
          <div className="premium-card" style={{ borderRadius:26, padding:22, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} style={{ width:58, height:58, borderRadius:'50%', objectFit:'cover' }} />
                : <div style={{ width:58, height:58, borderRadius:'50%', background:'var(--soft)', display:'grid', placeItems:'center' }}><Sparkles color="var(--orange)" /></div>
              }
              <div>
                <h3 style={{ fontFamily:'var(--display)', fontSize:18 }}>{profile?.full_name || 'Contributor'}</h3>
                <p style={{ color:'var(--muted)', fontSize:12 }}>Insight writer</p>
              </div>
            </div>
            <p style={{ marginTop:14, color:'var(--muted)', fontSize:13, lineHeight:1.65 }}>
              {profile?.bio || 'Add a bio in settings so readers know your voice.'}
            </p>
            <Link href="/settings" className="btn btn-soft" style={{ width:'100%', justifyContent:'center', marginTop:14, fontSize:13 }}>Edit profile</Link>
          </div>

          <div className="premium-card" style={{ borderRadius:26, padding:22, background:'var(--orange-soft)' }}>
            <p className="kicker">Editorial checklist</p>
            {['Strong headline','Premium cover image','Clear category','SEO title set','Readable body (2500+ chars)'].map(x => (
              <p key={x} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, fontWeight:800, marginTop:12 }}>
                <CheckCircle2 size={15} color="var(--orange)" /> {x}
              </p>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom:18 }}>
            {[
              [FileText,  posts.length,                'Total'],
              [CheckCircle2, published,                'Published'],
              [Clock,     drafts,                      'Drafts'],
              [Eye,       totalViews.toLocaleString(), 'Views'],
            ].map(([Icon, val, label]) => (
              <div key={label} className="premium-card" style={{ borderRadius:24, padding:20 }}>
                <Icon size={20} color="var(--orange)" />
                <p style={{ fontSize:30, fontWeight:950, letterSpacing:'-.04em', marginTop:12 }}>{val}</p>
                <p style={{ color:'var(--muted)', fontSize:12, fontWeight:800 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Top story */}
          {top && (
            <div className="premium-card" style={{ borderRadius:26, padding:22, marginBottom:18, display:'grid', gridTemplateColumns:'1fr auto', gap:18, alignItems:'center' }}>
              <div>
                <p className="kicker"><TrendingUp size={14} style={{ verticalAlign:'middle' }} /> Top performing story</p>
                <h2 style={{ fontFamily:'var(--display)', fontSize:22, letterSpacing:'-.04em', lineHeight:1.1, margin:'8px 0' }}>{top.title}</h2>
                <p style={{ color:'var(--muted)', fontSize:13 }}>
                  {(viewData[top.id]||0).toLocaleString()} views · {(reactionData[top.id]||0).toLocaleString()} reactions
                </p>
              </div>
              <BarChart3 size={38} color="var(--orange)" />
            </div>
          )}

          {/* Articles table */}
          <div className="premium-card" style={{ borderRadius:28, overflow:'hidden' }}>
            <div style={{ padding:'20px 22px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p className="kicker">Content library</p>
                <h2 className="section-title" style={{ fontSize:24 }}>Your articles</h2>
              </div>
              <Link href="/write" className="btn btn-dark" style={{ fontSize:13 }}>Write</Link>
            </div>

            {isLoading
              ? <div style={{ padding:40, textAlign:'center', color:'var(--muted)' }}>Loading...</div>
              : posts.length === 0
                ? <div style={{ padding:54, textAlign:'center' }}>
                    <PenLine size={42} color="var(--orange)" />
                    <h3 className="section-title" style={{ fontSize:26, marginTop:12 }}>No stories yet.</h3>
                    <p style={{ color:'var(--muted)', margin:'8px 0 18px' }}>Start with a feature, story or spotlight.</p>
                    <Link href="/write" className="btn btn-dark">Create first story</Link>
                  </div>
                : posts.map(post => (
                  <div key={post.id} style={{ display:'grid', gridTemplateColumns:'92px 1fr auto', gap:16, padding:'18px 22px', borderBottom:'1px solid var(--line)', alignItems:'center' }}>
                    {post.cover_image_url
                      ? <img src={post.cover_image_url} style={{ width:92, height:70, borderRadius:14, objectFit:'cover' }} />
                      : <div style={{ width:92, height:70, borderRadius:14, background:'var(--soft)' }} />
                    }
                    <div style={{ minWidth:0 }}>
                      <p className="kicker">{post.category?.name || 'uncategorised'}</p>
                      <h3 style={{ fontFamily:'var(--display)', fontSize:17, letterSpacing:'-.03em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', margin:'5px 0' }}>
                        {post.title}
                      </h3>
                      <p style={{ display:'flex', gap:12, color:'var(--muted)', fontSize:12, fontWeight:750, flexWrap:'wrap' }}>
                        <span style={{ color: post.status === 'published' ? '#147a50' : '#a16207' }}>{post.status}</span>
                        <span><Eye size={11} /> {(viewData[post.id]||0).toLocaleString()}</span>
                        <span><Heart size={11} /> {(reactionData[post.id]||0).toLocaleString()}</span>
                        <span>{timeAgo(post.published_at || post.created_at)}</span>
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => router.push('/write?edit=' + post.id)} className="tool-btn" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => togglePublish(post)} className="tool-btn"
                        style={{ color: post.status === 'published' ? 'var(--orange)' : '#147a50' }}
                        title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                        {post.status === 'published' ? <Clock size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                      <button onClick={() => del(post.id)} className="tool-btn" style={{ color:'#b42318' }} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))
            }
          </div>
        </main>
      </div>
    </div>
  )
}

const qc = new QueryClient()
export default function Dashboard() {
  return <QueryClientProvider client={qc}><DashboardContent /></QueryClientProvider>
}