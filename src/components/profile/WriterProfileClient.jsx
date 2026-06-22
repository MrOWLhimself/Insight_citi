'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import ArticleCard from '@/components/article/ArticleCard'
import { AuthorAvatar } from '@/components/article/ArticleCard'
import Link from 'next/link'
import { toast } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const qc = new QueryClient()

function Profile({ writer, articles, username }) {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data: followCheck } = useQuery({
    queryKey: ['follow', writer.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('inkwell_follows').select('id').eq('writer_id', writer.id).eq('follower_id', user.id).single()
      return data
    },
    enabled: !!writer.id && !!user?.id && writer.id !== user?.id
  })

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { toast.error('Sign in to follow'); return }
      if (followCheck) await supabase.from('inkwell_follows').delete().eq('id', followCheck.id)
      else await supabase.from('inkwell_follows').insert({ writer_id: writer.id, follower_id: user.id })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['follow', writer.id, user?.id] }); toast.success(followCheck ? 'Unfollowed' : 'Following!') }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10 pb-10 border-b border-gray-100">
        <div className="flex items-center gap-5">
          <AuthorAvatar author={writer} size="lg" />
          <div>
            <h1 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-ink-900 mb-1">{writer.full_name || `@${username}`}</h1>
            <p className="text-sm text-gray-400 mb-2">@{username}</p>
            {writer.bio && <p className="text-sm text-gray-500 max-w-sm">{writer.bio}</p>}
            <p className="text-xs text-gray-400 mt-2">{articles.length} stories · {writer.follower_count || 0} followers</p>
          </div>
        </div>
        {isAuthenticated && writer.id !== user?.id && (
          <button onClick={() => toggleFollow.mutate()}
            className={`shrink-0 self-start px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${followCheck ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
            {followCheck ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p style={{ fontFamily: 'Lora, serif' }} className="text-lg mb-2">No stories yet</p>
          {writer.id === user?.id && <Link href="/write" className="text-sm text-orange-500 hover:underline">Write your first story</Link>}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {articles.map(a => <div key={a.id} className="py-6"><ArticleCard article={a} variant="compact" /></div>)}
        </div>
      )}
    </div>
  )
}

export default function WriterProfileClient({ writer, articles, username }) {
  return (
    <QueryClientProvider client={qc}>
      <Profile writer={writer} articles={articles} username={username} />
    </QueryClientProvider>
  )
}
