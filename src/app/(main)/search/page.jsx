'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import ArticleCard from '@/components/article/ArticleCard'
import { AuthorAvatar } from '@/components/article/ArticleCard'
import Link from 'next/link'
import { Search as SearchIcon, X } from 'lucide-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const qc = new QueryClient()

function SearchContent() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('stories')

  const { data: articles = [], isLoading: la } = useQuery({
    queryKey: ['search-articles', q],
    queryFn: async () => {
      if (!q.trim() || q.length < 2) return []
      const { data } = await supabase.from('inkwell_articles')
        .select(`id, title, slug, cover_image, category, tags, body, published_at, clap_count, comment_count,
          author:profiles!inkwell_articles_author_id_fkey(id, username, full_name, avatar_url)`)
        .eq('status', 'published')
        .or(`title.ilike.%${q}%`)
        .order('published_at', { ascending: false })
        .limit(20)
      return data || []
    },
    enabled: q.trim().length > 1
  })

  const { data: writers = [], isLoading: lw } = useQuery({
    queryKey: ['search-writers', q],
    queryFn: async () => {
      if (!q.trim() || q.length < 2) return []
      const { data } = await supabase.from('profiles')
        .select('id, username, full_name, avatar_url, bio, follower_count')
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10)
      return data || []
    },
    enabled: q.trim().length > 1
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 mb-6 focus-within:border-orange-400 transition-colors">
        <SearchIcon size={18} className="text-gray-400 shrink-0" />
        <input value={q} onChange={e => setQ(e.target.value)} autoFocus
          placeholder="Search stories, writers, topics…"
          className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400" />
        {q && <button onClick={() => setQ('')}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>}
      </div>

      {q.length > 1 && (
        <div className="flex gap-1 mb-6">
          {['stories', 'writers'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${type === t ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t} {t === 'stories' ? `(${articles.length})` : `(${writers.length})`}
            </button>
          ))}
        </div>
      )}

      {q.trim().length > 1 ? (
        type === 'stories' ? (
          la ? <div className="py-8 text-center text-gray-400">Searching…</div>
          : articles.length === 0 ? <div className="py-16 text-center text-gray-400">No stories for "{q}"</div>
          : <div className="divide-y divide-gray-100">{articles.map(a => <div key={a.id} className="py-5"><ArticleCard article={a} variant="compact" /></div>)}</div>
        ) : (
          lw ? <div className="py-8 text-center text-gray-400">Searching…</div>
          : writers.length === 0 ? <div className="py-16 text-center text-gray-400">No writers found</div>
          : <div className="space-y-3">{writers.map(w => {
              const un = w.username || w.full_name?.toLowerCase().replace(/\s+/g,'') || 'writer'
              return (
                <Link key={w.id} href={`/@${un}`} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 border border-gray-100 transition-colors">
                  <AuthorAvatar author={w} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{w.full_name || un}</p>
                    <p className="text-sm text-gray-400">@{un} · {w.follower_count || 0} followers</p>
                    {w.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{w.bio}</p>}
                  </div>
                </Link>
              )
            })}</div>
        )
      ) : (
        <div className="text-center py-20 text-gray-300">
          <SearchIcon size={40} className="mx-auto mb-3" />
          <p style={{ fontFamily: 'Lora, serif' }} className="text-lg">Search for anything</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return <QueryClientProvider client={qc}><SearchContent /></QueryClientProvider>
}
