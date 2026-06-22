'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmt, timeAgo, readTime } from '@/lib/utils'
import Link from 'next/link'
import { PenLine, Eye, HandMetal, MessageCircle, Trash2, Edit, BookOpen, Users, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

const qc = new QueryClient()

function DashboardContent() {
  const { user, profile, isAuthenticated, isLoadingAuth } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const username = profile?.username || user?.email?.split('@')[0]

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) router.push('/login')
  }, [isAuthenticated, isLoadingAuth])

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['my-articles', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('inkwell_articles')
        .select('id, title, slug, cover_image, category, published_at, clap_count, comment_count, view_count, status, body')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!user?.id
  })

  const deleteArticle = useMutation({
    mutationFn: async (id) => { await supabase.from('inkwell_articles').delete().eq('id', id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-articles'] }); toast.success('Deleted') }
  })

  if (!isAuthenticated && !isLoadingAuth) return null

  const published = articles.filter(a => a.status === 'published')
  const drafts = articles.filter(a => a.status === 'draft')
  const totalViews = published.reduce((s, a) => s + (a.view_count || 0), 0)
  const totalClaps = published.reduce((s, a) => s + (a.clap_count || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-ink-900">Your dashboard</h1>
        <Link href="/write" className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors">
          <PenLine size={14} /> New story
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Eye, label: 'Total views', value: (totalViews || 0).toLocaleString() },
          { icon: HandMetal, label: 'Total claps', value: (totalClaps || 0).toLocaleString() },
          { icon: BookOpen, label: 'Published', value: published.length },
          { icon: Edit, label: 'Drafts', value: drafts.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-50 rounded-2xl p-4">
            <Icon size={14} className="text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-ink-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <p style={{ fontFamily: 'Lora, serif' }} className="text-lg mb-3">No stories yet</p>
          <Link href="/write" className="text-sm text-orange-500 hover:underline">Write your first story</Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {articles.map(article => (
            <div key={article.id} className="py-5 flex items-start gap-4">
              {article.cover_image && (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'Lora, serif' }} className="font-semibold text-ink-900 line-clamp-2 mb-1">{article.title}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{article.status}</span>
                  <span>{timeAgo(article.published_at || article.updated_at)}</span>
                  {article.status === 'published' && <>
                    <span className="flex items-center gap-1"><Eye size={10} />{article.view_count || 0}</span>
                    <span className="flex items-center gap-1"><HandMetal size={10} />{article.clap_count || 0}</span>
                  </>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/write?id=${article.id}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                  <Edit size={14} />
                </Link>
                {article.status === 'published' && (
                  <Link href={`/@${username}/${article.slug}`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                    <Eye size={14} />
                  </Link>
                )}
                <button onClick={() => { if (confirm('Delete?')) deleteArticle.mutate(article.id) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return <QueryClientProvider client={qc}><DashboardContent /></QueryClientProvider>
}
