// ✅ SERVER COMPONENT — no 'use client'
// Reads from real schema: insight_posts + insight_categories + insight_post_tags
import React from 'react'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase-server'
import { contentToText, slugifyAuthor, timeAgo } from '@/lib/schema'
import {
  ArrowRight, TrendingUp, PenLine, Globe2, Newspaper, Zap, Heart, BookOpen,
  FileText, Star, Feather, MessageCircle, Gem, Briefcase, Cpu, Brain,
  GraduationCap, Activity, Clapperboard, Trophy, Plane, Palette, Landmark,
  Leaf, Shirt, Utensils, Music2, PlaySquare, MapPin, Users, ShieldCheck
} from 'lucide-react'

export const revalidate = 60

const CATS = [
  ['news','News',Newspaper],['breaking-news','Breaking',Zap],['lifestyles','Lifestyle',Heart],
  ['stories','Stories',BookOpen],['articles','Articles',FileText],['features','Features',Star],
  ['editorial','Editorial',Feather],['opinion','Opinion',MessageCircle],['spotlight','Spotlight',Gem],
  ['business','Business',Briefcase],['technology','Technology',Cpu],['ai','AI',Brain],
  ['education','Education',GraduationCap],['health','Health',Activity],
  ['entertainment','Entertainment',Clapperboard],['sports','Sports',Trophy],
  ['travel','Travel',Plane],['culture','Culture',Palette],['politics','Politics',Landmark],
  ['environment','Environment',Leaf],['fashion','Fashion',Shirt],['food','Food',Utensils],
  ['music','Music',Music2],['videos','Videos',PlaySquare],
  ['ijebu','Ijebu',MapPin],['ogun-state','Ogun State',MapPin],
  ['nigeria','Nigeria',MapPin],['africa','Africa',Globe2],['world','World',Globe2],
]

const fallback = [
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1400',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400',
]

// ── server data fetch using REAL columns ────────────────────────────────────
async function getPosts() {
  try {
    const sb = createServerSupabase()

    // Fetch posts — use real columns: cover_image_url, content, category (uuid FK)
    const { data, error } = await sb
      .from('insight_posts')
      .select(`
        id, title, slug, excerpt, content, cover_image_url,
        status, is_featured, published_at, created_at, author_id,
        category:insight_categories!insight_posts_category_fkey(id, name, slug)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) {
      console.error('[Insight homepage] insight_posts error:', error.message)
      return { posts: [], error: error.message }
    }

    const rows = Array.isArray(data) ? data : []
    const authorIds = [...new Set(rows.map(p => p.author_id).filter(Boolean))]

    let profiles = {}
    if (authorIds.length) {
      const { data: pr } = await sb
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .in('id', authorIds)
      profiles = Object.fromEntries((pr || []).map(p => [p.id, p]))
    }

    // Fetch view counts from insight_views (count rows per post)
    let viewCounts = {}
    if (rows.length) {
      const { data: views } = await sb
        .from('insight_views')
        .select('post_id')
        .in('post_id', rows.map(r => r.id))
      if (views) {
        views.forEach(v => { viewCounts[v.post_id] = (viewCounts[v.post_id] || 0) + 1 })
      }
    }

    // Fetch reaction counts from insight_reactions
    let reactionCounts = {}
    if (rows.length) {
      const { data: reactions } = await sb
        .from('insight_reactions')
        .select('post_id')
        .in('post_id', rows.map(r => r.id))
      if (reactions) {
        reactions.forEach(r => { reactionCounts[r.post_id] = (reactionCounts[r.post_id] || 0) + 1 })
      }
    }

    const posts = rows.map(p => ({
      ...p,
      author: profiles[p.author_id] || null,
      view_count: viewCounts[p.id] || 0,
      reaction_count: reactionCounts[p.id] || 0,
    }))

    return { posts, error: null }
  } catch (e) {
    console.error('[Insight homepage] unexpected error:', e.message)
    return { posts: [], error: e.message }
  }
}

// ── sub-components (server — no hooks) ────────────────────────────────────
function ArticleTile({ post: p, i, compact = false }) {
  const authorHref = '/u/' + slugifyAuthor(p.author?.full_name) + '/' + p.slug
  return (
    <Link className="article-card premium-card tile-card" href={authorHref}>
      <div className="image-wrap" style={{ height: compact ? 170 : 210 }}>
        <img src={p.cover_image_url || fallback[i % 4]} alt={p.title} />
      </div>
      <div>
        <p className="kicker">{p.category?.name || 'Insight'}</p>
        <h2>{p.title}</h2>
        <p>{p.author?.full_name || 'Insight Desk'} · {timeAgo(p.published_at || p.created_at)}</p>
      </div>
    </Link>
  )
}

function EmptyHome() {
  return (
    <section className="container" style={{ padding:'70px 0', textAlign:'center' }}>
      <h2 className="section-title" style={{ fontSize:44 }}>Insight is ready.</h2>
      <p style={{ color:'var(--muted)', margin:'12px auto 22px', maxWidth:560, lineHeight:1.7 }}>
        Publish your first story from the contributor dashboard.
      </p>
      <Link href="/write" className="btn btn-dark">Write first story</Link>
    </section>
  )
}

function HomeError({ error }) {
  return (
    <section className="container" style={{ padding:'70px 0', textAlign:'center' }}>
      <h2 className="section-title" style={{ fontSize:32 }}>Could not load stories.</h2>
      <p style={{ color:'var(--muted)', maxWidth:680, margin:'12px auto 0', lineHeight:1.7 }}>
        {error}
      </p>
      <p style={{ color:'var(--muted)', fontSize:13, marginTop:12 }}>
        Check that <code>insight_posts</code> has public read RLS for <code>status = published</code>.
      </p>
    </section>
  )
}

// ── Main async page ─────────────────────────────────────────────────────────
export default async function Home() {
  const { posts, error } = await getPosts()
  if (error) return <HomeError error={error} />

  const hero     = posts[0]
  const side     = posts.slice(1, 5)
  const features = posts.filter(p => ['features','spotlight','stories','editorial'].includes(p.category?.slug)).slice(0, 6)
  const latest   = posts.slice(0, 14)
  const trending = [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5)

  return (
    <div>
      {/* Hero intro */}
      <section className="hero-shell">
        <div className="container hero-intro">
          <p className="kicker">Premium stories. Global voices. Local depth.</p>
          <h1 className="hero-title">Insightful stories for culture, people, business and the world.</h1>
          <p className="hero-copy">
            A modern news and magazine platform for contributors everywhere — from city reports and campus culture
            to African innovation, global conversations, lifestyle, sport, features and human stories.
          </p>
          <div className="hero-actions">
            <Link href="/write" className="btn btn-dark"><PenLine size={16} /> Become a contributor</Link>
            <Link href="/topic/features" className="btn btn-orange">Explore features <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="container voice-strip-wrap">
        <div className="voice-strip">
          <div><Globe2 size={24} /><b>Open to every voice.</b><span>Writers from any city, campus or country can publish and be heard.</span></div>
          <div><Star size={24} /><b>Modern categories.</b><span>News, lifestyle, business, sport, tech, culture, Africa, world and more.</span></div>
          <div><Users size={24} /><b>Contributor first.</b><span>Tools, dashboards and editorial support to help writers grow.</span></div>
          <div><ShieldCheck size={24} /><b>Trusted editorial.</b><span>Quality stories with review, structure and SEO discipline.</span></div>
        </div>
      </section>

      {/* Hero grid */}
      {!hero ? <EmptyHome /> : (
        <section className="container top-grid">
          <Link className="article-card hero-card" href={'/u/' + slugifyAuthor(hero.author?.full_name) + '/' + hero.slug}>
            <div className="image-wrap hero-img">
              <img src={hero.cover_image_url || fallback[0]} alt={hero.title} />
            </div>
            <div className="hero-overlay" />
            <div className="hero-card-content">
              <span className="kicker">{hero.category?.name || 'Feature'}</span>
              <h2>{hero.title}</h2>
              <p>{(hero.excerpt || contentToText(hero.content)).slice(0, 170)}...</p>
              <small>
                {hero.author?.full_name || 'Insight Desk'} · {timeAgo(hero.published_at || hero.created_at)} · {hero.view_count.toLocaleString()} views
              </small>
            </div>
          </Link>
          <div className="top-side">
            <h3 className="side-title">Top Stories</h3>
            {side.map((p, i) => (
              <Link key={p.id} className="article-card side-story" href={'/u/' + slugifyAuthor(p.author?.full_name) + '/' + p.slug}>
                <div className="image-wrap"><img src={p.cover_image_url || fallback[(i+1)%4]} alt={p.title} /></div>
                <div>
                  <p className="kicker">{p.category?.name || 'Story'}</p>
                  <h4>{p.title}</h4>
                  <small>{timeAgo(p.published_at || p.created_at)}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container categories-block">
        <div className="section-head">
          <h2 className="section-title">Explore Categories</h2>
          <Link href="/topic/news">View all →</Link>
        </div>
        <div className="category-grid">
          {CATS.map(([slug, label, Icon]) => (
            <Link key={slug} href={`/topic/${slug}`} className="modern-cat">
              <Icon size={22} /><span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest + trending sidebar */}
      <section className="container latest-layout">
        <div>
          <div className="section-head line">
            <h2 className="section-title">Latest Dispatches</h2>
            <Link href="/topic/news">All news →</Link>
          </div>
          <div className="latest-grid">
            {latest.map((p, i) => <ArticleTile key={p.id} post={p} i={i} />)}
          </div>
        </div>
        <aside>
          <div className="sticky-col">
            <div className="premium-card trend-card">
              <div className="trend-head"><TrendingUp size={18} /><h3>Trending Now</h3></div>
              {trending.length
                ? trending.map((p, i) => (
                  <Link key={p.id} href={'/u/' + slugifyAuthor(p.author?.full_name) + '/' + p.slug} className="trend-link">
                    <span>{i + 1}</span><b>{p.title}</b>
                  </Link>
                ))
                : <p style={{ color:'var(--muted)', fontSize:13 }}>Publish stories to activate trending.</p>
              }
            </div>
            <div className="premium-card contributor-box">
              <p className="kicker">Contributors</p>
              <h3>Write from anywhere.</h3>
              <p>Submit features, create spotlight stories, track views and manage drafts from your editorial dashboard.</p>
              <Link href="/dashboard" className="btn btn-dark">Open dashboard</Link>
            </div>
          </div>
        </aside>
      </section>

      {/* Features section */}
      <section className="container features-block">
        <div className="section-head">
          <h2 className="section-title">Features, Stories & Spotlight</h2>
          <Link href="/topic/features">View features →</Link>
        </div>
        <div className="feature-grid">
          {(features.length ? features : posts.slice(0, 6)).map((p, i) => (
            <ArticleTile key={p.id} post={p} i={i} compact />
          ))}
        </div>
      </section>
    </div>
  )
}