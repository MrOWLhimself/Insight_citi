import AdDisplay from '@/components/AdDisplay'
import { createServerSupabase } from '@/lib/supabase'
import { CATEGORIES, extractText, timeAgo, readTime } from '@/lib/utils'
import ArticleCard from '@/components/article/ArticleCard'
import Link from 'next/link'
import { TrendingUp, Users, ArrowRight, Flame, PenLine } from 'lucide-react'

export const revalidate = 60

const ARTICLE_SELECT = `id, title, slug, cover_image, category, tags, body, published_at, clap_count, comment_count,
  author:profiles!inkwell_articles_author_id_fkey(id, username, full_name, avatar_url)`

async function getArticles() {
  const sb = createServerSupabase()
  const { data } = await sb.from('inkwell_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)
  return data || []
}

async function getTopWriters() {
  const sb = createServerSupabase()
  const { data } = await sb.from('profiles')
    .select('id, username, full_name, avatar_url, bio, follower_count')
    .order('follower_count', { ascending: false })
    .limit(5)
  return data || []
}

export default async function HomePage() {
  const [articles, writers] = await Promise.all([getArticles(), getTopWriters()])

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 40px' }}>

      {/* Category strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0 mb-0 scrollbar-hide border-b border-gray-100 pt-2">
        <Link href="/"
          className="flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold whitespace-nowrap border-b-2 border-black text-black">
          <Flame size={13} /> For you
        </Link>
        {CATEGORIES.map(cat => (
          <Link key={cat.slug} href={`/topic/${cat.slug}`}
            className="px-4 py-3 text-[13px] font-medium whitespace-nowrap text-gray-500 hover:text-black border-b-2 border-transparent hover:border-black transition-all">
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-0 mt-0">

        {/* ── LEFT: Article feed ── */}
        <div className="flex-1 min-w-0 border-r border-gray-100 pr-8 py-8">
          <AdDisplay slotId="ins-home-top" className="mb-4" />
          {articles.length === 0 ? (
            <div className="text-center py-32">
              <p style={{ fontFamily: 'Lora, Georgia, serif' }} className="text-2xl font-bold text-gray-900 mb-3">No stories yet</p>
              <p className="text-gray-400 mb-6 text-sm">Be the first to write on Insight</p>
              <Link href="/write"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors">
                <PenLine size={15} /> Write the first one
              </Link>
            </div>
          ) : (
            <div>
              {articles.map((article, i) => {
                const username = article.author?.username || article.author?.full_name?.toLowerCase().replace(/\s+/g,'') || 'writer'
                const excerpt = extractText(article.body)
                const rt = readTime(article.body)
                const catColors = {
                  news:'#1a1a1a', lifestyle:'#f97316', culture:'#ea580c', opinion:'#7c3aed',
                  tech:'#0369a1', sports:'#dc2626', business:'#b45309', entertainment:'#9333ea',
                  health:'#16a34a', personal:'#6b7280', travel:'#0891b2', food:'#d97706',
                }
                const catColor = catColors[article.category] || '#6b7280'
                const initials = (article.author?.full_name || 'A').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

                return (
                  <article key={article.id}
                    className={`py-8 ${i < articles.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-start justify-between gap-8">

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        {/* Author row */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0">
                            {article.author?.avatar_url
                              ? <img src={article.author.avatar_url} alt="" className="w-full h-full object-cover" />
                              : initials}
                          </div>
                          <Link href={`/u/${username}`}
                            className="text-[13px] font-semibold text-gray-800 hover:text-black transition-colors">
                            {article.author?.full_name || username}
                          </Link>
                          <span className="text-gray-300">·</span>
                          <span className="text-[13px] text-gray-400">{timeAgo(article.published_at)}</span>
                        </div>

                        {/* Title + excerpt */}
                        <Link href={`/u/${username}/${article.slug}`} className="group block">
                          <h2 style={{ fontFamily: 'Lora, Georgia, serif', letterSpacing: '-0.02em' }}
                            className={`font-bold text-gray-900 group-hover:text-orange-500 transition-colors leading-tight mb-2 ${
                              i === 0 ? 'text-[28px]' : 'text-[20px]'
                            }`}>
                            {article.title}
                          </h2>
                          {excerpt && (
                            <p className={`text-gray-500 leading-relaxed line-clamp-2 ${i === 0 ? 'text-[16px]' : 'text-[14px]'}`}>
                              {excerpt}
                            </p>
                          )}
                        </Link>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                            style={{ color: catColor, background: `${catColor}15` }}>
                            {article.category}
                          </span>
                          <span className="text-[13px] text-gray-400">{rt}</span>
                          {article.clap_count > 0 && (
                            <span className="text-[13px] text-gray-400">👏 {article.clap_count}</span>
                          )}
                          {article.comment_count > 0 && (
                            <span className="text-[13px] text-gray-400">💬 {article.comment_count}</span>
                          )}
                        </div>
                      </div>

                      {/* Cover image */}
                      {article.cover_image && (
                        <Link href={`/u/${username}/${article.slug}`}
                          className={`shrink-0 rounded-xl overflow-hidden bg-gray-100 ${i === 0 ? 'w-[220px] h-[148px]' : 'w-[112px] h-[80px]'}`}>
                          <img src={article.cover_image} alt={article.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <aside className="w-[340px] shrink-0 pl-10 py-8 hidden lg:block">

          {/* Trending topics */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-orange-500" />
              <h3 style={{ fontFamily: 'Lora, Georgia, serif' }} className="font-bold text-[16px] text-gray-900">Trending topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 10).map(cat => (
                <Link key={cat.slug} href={`/topic/${cat.slug}`}
                  className="px-3 py-1.5 text-[13px] font-semibold text-gray-700 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-all">
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-100 mb-8" />

          {/* Writers to follow */}
          {writers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} className="text-orange-500" />
                <h3 style={{ fontFamily: 'Lora, Georgia, serif' }} className="font-bold text-[16px] text-gray-900">Writers to follow</h3>
              </div>
              <div className="space-y-4">
                {writers.map(writer => {
                  const un = writer.username || writer.full_name?.toLowerCase().replace(/\s+/g,'') || 'writer'
                  const initials = (writer.full_name || 'W').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <Link key={writer.id} href={`/u/${un}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden">
                        {writer.avatar_url
                          ? <img src={writer.avatar_url} alt="" className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{writer.full_name || un}</p>
                        <p className="text-[12px] text-gray-400 font-medium">{writer.follower_count || 0} followers</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <Link href="/search?type=writers"
                className="inline-flex items-center gap-1 text-[13px] text-orange-500 mt-4 hover:text-orange-600 font-semibold transition-colors">
                See more writers <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <AdDisplay slotId="ins-home-sidebar-mid" className="mb-4" />

          <hr className="border-gray-100 mb-8" />

          {/* Write CTA */}
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <PenLine size={18} className="text-orange-400" />
            </div>
            <p style={{ fontFamily: 'Lora, Georgia, serif' }} className="font-bold text-white text-[16px] mb-1.5">Write on Insight</p>
            <p className="text-[13px] text-gray-400 mb-4 leading-relaxed">Share your story. Free, always.</p>
            <Link href="/write"
              className="block w-full py-3 bg-orange-500 text-white rounded-xl text-[14px] font-bold hover:bg-orange-600 transition-colors">
              Start writing
            </Link>
          </div>

        </aside>
      </div>
    </div>
  )
}
