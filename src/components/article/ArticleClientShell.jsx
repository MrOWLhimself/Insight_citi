'use client'
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { timeAgo, readTime, getCategoryLabel, getCategoryColor, extractText } from '@/lib/utils'
import { AuthorAvatar } from '@/components/article/ArticleCard'
import Link from 'next/link'
import { HandMetal, MessageCircle, Bookmark, Share2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const qc = new QueryClient()

function Shell({ article, comments: initialComments }) {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [claps, setClaps] = useState(article.clap_count || 0)
  const [userClaps, setUserClaps] = useState(0)
  const [comment, setComment] = useState('')
  const [clapAnimating, setClapAnimating] = useState(false)
  const clapTimerRef = useRef(null)
  const clapBatchRef = useRef(0)

  const { data: comments = initialComments } = useQuery({
    queryKey: ['comments', article.id],
    queryFn: async () => {
      const { data } = await supabase.from('inkwell_comments')
        .select('*, author:profiles!inkwell_comments_user_id_fkey(id, username, full_name, avatar_url)')
        .eq('article_id', article.id).is('parent_id', null)
        .order('created_at', { ascending: false })
      return data || []
    },
    initialData: initialComments,
  })

  const { data: savedCheck } = useQuery({
    queryKey: ['saved', article.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('inkwell_saves').select('id').eq('article_id', article.id).eq('user_id', user.id).single()
      return data
    },
    enabled: !!user?.id,
  })

  const { data: followCheck } = useQuery({
    queryKey: ['follow', article.author_id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('inkwell_follows').select('id').eq('writer_id', article.author_id).eq('follower_id', user.id).single()
      return data
    },
    enabled: !!article.author_id && !!user?.id && article.author_id !== user?.id,
  })

  function getSession() {
    let s = sessionStorage.getItem('inkwell_session')
    if (!s) { s = Math.random().toString(36).slice(2); sessionStorage.setItem('inkwell_session', s) }
    return s
  }

  const handleClap = () => {
    if (userClaps >= 50) return
    setUserClaps(c => c + 1)
    setClaps(c => c + 1)
    clapBatchRef.current += 1
    setClapAnimating(true)
    setTimeout(() => setClapAnimating(false), 200)
    clearTimeout(clapTimerRef.current)
    clapTimerRef.current = setTimeout(async () => {
      await supabase.from('inkwell_claps').upsert({ article_id: article.id, user_id: user?.id || null, session_id: getSession(), count: clapBatchRef.current }, { onConflict: 'article_id,session_id' })
      await supabase.from('inkwell_articles').update({ clap_count: claps + clapBatchRef.current }).eq('id', article.id)
      clapBatchRef.current = 0
    }, 1500)
  }

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { toast.error('Sign in to save'); return }
      if (savedCheck) await supabase.from('inkwell_saves').delete().eq('id', savedCheck.id)
      else await supabase.from('inkwell_saves').insert({ article_id: article.id, user_id: user.id })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saved', article.id, user?.id] }); toast.success(savedCheck ? 'Removed' : 'Saved!') }
  })

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { toast.error('Sign in to follow'); return }
      if (followCheck) await supabase.from('inkwell_follows').delete().eq('id', followCheck.id)
      else await supabase.from('inkwell_follows').insert({ writer_id: article.author_id, follower_id: user.id })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['follow', article.author_id, user?.id] }); toast.success(followCheck ? 'Unfollowed' : 'Following!') }
  })

  const submitComment = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { toast.error('Sign in to comment'); return }
      if (!comment.trim()) return
      const { error } = await supabase.from('inkwell_comments').insert({ article_id: article.id, user_id: user.id, body: comment.trim() })
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', article.id] }); setComment(''); toast.success('Posted!') }
  })

  const renderBody = (body) => {
    if (!body) return null
    if (typeof body === 'string') return <div className="prose-inkwell" dangerouslySetInnerHTML={{ __html: body }} />
    const renderNode = (node, i) => {
      if (!node) return null
      switch (node.type) {
        case 'paragraph': return <p key={i}>{node.content?.map((n,j)=>renderNode(n,j))}</p>
        case 'text': {
          let el = node.text
          if (node.marks?.find(m=>m.type==='bold')) el = <strong key={i}>{el}</strong>
          if (node.marks?.find(m=>m.type==='italic')) el = <em key={i}>{el}</em>
          if (node.marks?.find(m=>m.type==='highlight')) el = <mark key={i}>{el}</mark>
          if (node.marks?.find(m=>m.type==='link')) el = <a key={i} href={node.marks.find(m=>m.type==='link').attrs.href} target="_blank" rel="noopener noreferrer">{el}</a>
          return el
        }
        case 'heading': return React.createElement(`h${node.attrs?.level||2}`,{key:i},node.content?.map((n,j)=>renderNode(n,j)))
        case 'blockquote': return <blockquote key={i}>{node.content?.map((n,j)=>renderNode(n,j))}</blockquote>
        case 'bulletList': return <ul key={i}>{node.content?.map((n,j)=>renderNode(n,j))}</ul>
        case 'orderedList': return <ol key={i}>{node.content?.map((n,j)=>renderNode(n,j))}</ol>
        case 'listItem': return <li key={i}>{node.content?.map((n,j)=>renderNode(n,j))}</li>
        case 'image': return <img key={i} src={node.attrs?.src} alt={node.attrs?.alt||''} />
        case 'horizontalRule': return <hr key={i} />
        case 'codeBlock': return <pre key={i}><code>{node.content?.map((n,j)=>renderNode(n,j))}</code></pre>
        case 'hardBreak': return <br key={i} />
        default: return node.content?.map((n,j)=>renderNode(n,j))
      }
    }
    return <div className="prose-inkwell">{body.content?.map((n,i)=>renderNode(n,i))}</div>
  }

  const authorUsername = article.author?.username || 'writer'
  const catColor = getCategoryColor(article.category)

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-8 group transition-colors">
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <div className="mb-4">
        <Link href={`/topic/${article.category}`} className="text-xs font-bold uppercase tracking-widest" style={{ color: catColor }}>
          {getCategoryLabel(article.category)}
        </Link>
      </div>

      <h1 style={{ fontFamily: 'Lora, Georgia, serif' }} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 leading-tight mb-4">
        {article.title}
      </h1>

      <div className="flex items-center justify-between gap-4 py-5 border-y border-gray-100 mb-8">
        <div className="flex items-center gap-3">
          <AuthorAvatar author={article.author} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/@${authorUsername}`} className="font-semibold text-sm text-gray-800 hover:text-orange-500 transition-colors">
                {article.author?.full_name || authorUsername}
              </Link>
              {isAuthenticated && article.author_id !== user?.id && (
                <button onClick={() => toggleFollow.mutate()}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${followCheck ? 'border-gray-300 text-gray-500 bg-gray-50' : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'}`}>
                  {followCheck ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {timeAgo(article.published_at)} · {readTime(article.body)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => toggleSave.mutate()} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${savedCheck ? 'text-orange-500' : 'text-gray-400'}`}>
            <Bookmark size={18} fill={savedCheck ? '#f97316' : 'none'} />
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {article.cover_image && (
        <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden mb-10 bg-gray-100">
          <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {renderBody(article.body)}

      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100">
          {article.tags.map(tag => (
            <Link key={tag} href={`/tag/${tag}`}
              className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-orange-50 hover:text-orange-500 rounded-full border border-gray-100 transition-colors">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-5 py-6 my-8 border-y border-gray-100">
        <button onClick={handleClap} className={`flex items-center gap-2 group ${userClaps >= 50 ? 'opacity-50' : ''}`}>
          <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${userClaps > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-400'} ${clapAnimating ? 'clap-pop' : ''}`}>
            <HandMetal size={18} className={userClaps > 0 ? 'text-orange-500' : 'text-gray-400'} />
          </div>
          <span className="text-sm text-gray-500 font-medium">{claps > 0 ? claps : ''}</span>
        </button>
        <div className="flex items-center gap-2 text-gray-400">
          <MessageCircle size={18} />
          <span className="text-sm">{comments.length}</span>
        </div>
        {userClaps > 0 && <span className="text-xs text-orange-500 font-medium">{userClaps} clap{userClaps !== 1 ? 's' : ''} from you</span>}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 mb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AuthorAvatar author={article.author} size="lg" />
            <div>
              <Link href={`/@${authorUsername}`} style={{ fontFamily: 'Lora, serif' }} className="font-bold text-ink-900 hover:text-orange-500 transition-colors">
                {article.author?.full_name || authorUsername}
              </Link>
              <p className="text-xs text-gray-400 mb-2">{article.author?.follower_count || 0} followers</p>
              {article.author?.bio && <p className="text-sm text-gray-500 max-w-sm">{article.author.bio}</p>}
            </div>
          </div>
          {isAuthenticated && article.author_id !== user?.id && (
            <button onClick={() => toggleFollow.mutate()}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${followCheck ? 'bg-gray-200 text-gray-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
              {followCheck ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: 'Lora, serif' }} className="text-xl font-semibold text-ink-900 mb-6">Responses ({comments.length})</h3>
        {isAuthenticated ? (
          <div className="flex gap-3 mb-8">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {(user.email||'U')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-orange-400 transition-colors"
                rows={3} />
              <div className="flex justify-end mt-2">
                <button onClick={() => submitComment.mutate()} disabled={!comment.trim() || submitComment.isPending}
                  className="px-5 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50">
                  Respond
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-gray-500 mb-3">Sign in to leave a response</p>
            <Link href="/login" className="px-5 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors">Sign in</Link>
          </div>
        )}
        <div className="space-y-6">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <AuthorAvatar author={c.author} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{c.author?.full_name || 'Reader'}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

// Need React for createElement in renderBody
import React from 'react'

export default function ArticleClientShell({ article, comments }) {
  return (
    <QueryClientProvider client={qc}>
      <Shell article={article} comments={comments} />
    </QueryClientProvider>
  )
}
