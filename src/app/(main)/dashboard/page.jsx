'use client'
export const dynamic = 'force-dynamic'
import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmt, timeAgo, readTime } from '@/lib/utils'
import Link from 'next/link'
import { PenLine, Eye, Star, MessageCircle, Trash2, Edit, TrendingUp, Users, BarChart3, ArrowUp, ArrowDown, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'


function StatCard({ label, value, sub, icon: Icon, color = 'text-orange-500', trend }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center mb-3 ${color}`}>
        <Icon size={17} />
      </div>
      <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-300 mt-0.5">{sub}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          {Math.abs(trend)}% this month
        </div>
      )}
    </div>
  )
}

function DashboardContent() {
  const { user, profile, isAuthenticated, isLoadingAuth } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const username = profile?.username || user?.email?.split('@')[0]

  useEffect(() => { if (!isLoadingAuth && !isAuthenticated) router.push('/login') }, [isAuthenticated, isLoadingAuth])

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['my-articles', user?.id],
    queryFn: async () => {
      const { data } = await supabase?.from('inkwell_articles')
        .select('id, title, slug, cover_image, category, published_at, clap_count, comment_count, view_count, status, body, is_paywalled')
        .eq('author_id', user.id).order('published_at', { ascending: false })
      return Array.isArray(data) ? data : []
    },
    enabled: !!user,
  })

  const { data: followers } = useQuery({
    queryKey: ['my-followers', user?.id],
    queryFn: async () => {
      const { count } = await supabase?.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id)
      return count || 0
    },
    enabled: !!user,
  })

  const deleteArticle = useMutation({
    mutationFn: async (id) => { await supabase?.from('inkwell_articles').delete().eq('id', id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] }); toast.success('Article deleted') }
  })

  const togglePaywall = useMutation({
    mutationFn: async ({ id, current }) => {
      await supabase?.from('inkwell_articles').update({ is_paywalled: !current }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] })
  })

  const articleList = Array.isArray(articles) ? articles : []
  const published = articleList.filter(a => a.status === 'published')
  const totalViews = articleList.reduce((s, a) => s + (a.view_count || 0), 0)
  const totalClaps = articleList.reduce((s, a) => s + (a.clap_count || 0), 0)
  const totalComments = articleList.reduce((s, a) => s + (a.comment_count || 0), 0)

  if (!isAuthenticated || isLoadingAuth) return (
    <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: 'Lora, Georgia, serif' }} className="text-3xl font-bold text-gray-900 mb-1">
            Your stories
          </h1>
          <p className="text-gray-400 text-sm">Welcome back, {profile?.full_name?.split(' ')[0] || username}</p>
        </div>
        <Link href="/write"
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors shrink-0">
          <PenLine size={15} /> Write new
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Published" value={published.length} icon={Globe} color="text-green-500" />
        <StatCard label="Total Views" value={fmt(totalViews)} icon={Eye} color="text-blue-500" />
        <StatCard label="Total Claps" value={fmt(totalClaps)} icon={Star} color="text-orange-500" />
        <StatCard label="Followers" value={fmt(followers)} icon={Users} color="text-purple-500" />
      </div>

      {/* Per-article analytics */}
      {published.length > 0 && (
        <div className="mb-8 bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <BarChart3 size={15} className="text-orange-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Article Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Article', 'Views', 'Claps', 'Comments', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {published.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).map(a => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{a.title}</p>
                      <p className="text-[11px] text-gray-400">{readTime(a.body)} · {a.category}</p>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-blue-500">{fmt(a.view_count)}</td>
                    <td className="px-5 py-3 text-sm font-bold text-orange-500">{a.clap_count}</td>
                    <td className="px-5 py-3 text-sm font-bold text-purple-500">{a.comment_count}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Published</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All articles */}
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        All stories <span className="text-xs text-gray-400 font-normal">({articleList.length})</span>
      </h2>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
      ) : articleList.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
          <PenLine size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">No stories yet</p>
          <p className="text-gray-400 text-sm mb-4">Write your first story and share it with the world.</p>
          <Link href="/write" className="px-6 py-2.5 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors">
            Start writing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {articleList.map(article => {
            const rt = readTime(article.body)
            return (
              <div key={article.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-all">
                {article.cover_image && (
                  <div className="w-16 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 line-clamp-1">{article.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className={`font-semibold px-2 py-0.5 rounded-full ${article.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {article.status}
                    </span>
                    <span className="capitalize">{article.category}</span>
                    <span>{rt}</span>
                    {article.view_count > 0 && <span className="flex items-center gap-1 text-blue-400"><Eye size={10} />{fmt(article.view_count)}</span>}
                    {article.is_paywalled && <span className="flex items-center gap-1 text-purple-500"><Lock size={10} /> Members only</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => togglePaywall.mutate({ id: article.id, current: article.is_paywalled })}
                    title={article.is_paywalled ? 'Make free' : 'Make members only'}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${article.is_paywalled ? 'bg-purple-50 text-purple-500' : 'hover:bg-gray-50 text-gray-300 hover:text-gray-500'}`}>
                    <Lock size={14} />
                  </button>
                  <Link href={`/write?edit=${article.id}`}
                    className="w-8 h-8 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit size={14} />
                  </Link>
                  <button onClick={() => { if (confirm('Delete this article?')) deleteArticle.mutate(article.id) }}
                    className="w-8 h-8 rounded-xl hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [queryClient] = React.useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}><DashboardContent /></QueryClientProvider>
}
