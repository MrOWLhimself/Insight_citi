'use client'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Heart, Share2, X, Bookmark } from 'lucide-react'
import { toast } from 'sonner'

export default function ArticleActions({ postId, reactionCount, url, title, excerpt, coverImageUrl, categoryName }) {
  const { user } = useAuth()
  const [count, setCount] = useState(reactionCount)
  const [reacted, setReacted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const react = async () => {
    if (!user) { toast.error('Sign in to react'); return }
    if (reacted) return
    // insight_reactions: post_id, user_id, reaction (no id column)
    const { error } = await supabase.from('insight_reactions').insert({
      post_id: postId, user_id: user.id, reaction: 'clap'
    })
    if (!error) { setCount(c => c + 1); setReacted(true) }
    else toast.error(error.message)
  }

  const bookmark = async () => {
    if (!user) { toast.error('Sign in to bookmark'); return }
    if (bookmarked) {
      // insight_bookmarks PK is (post_id, user_id) — no id column
      await supabase.from('insight_bookmarks').delete().match({ post_id: postId, user_id: user.id })
      setBookmarked(false); toast.success('Removed from bookmarks')
    } else {
      const { error } = await supabase.from('insight_bookmarks').insert({ post_id: postId, user_id: user.id })
      if (!error) { setBookmarked(true); toast.success('Bookmarked!') }
      else toast.error(error.message)
    }
  }

  const copyLink = () => { navigator.clipboard.writeText(url); toast.success('Link copied!'); setShareOpen(false) }

  const enc = encodeURIComponent
  const msg = enc('Read this on Insight: ' + title + ' — ' + url)

  return (
    <>
      <div className="share-actions-wrap">
        <button onClick={react} className={'article-action' + (reacted ? ' is-clapped' : '')}>
          <Heart size={15} /> {count > 0 ? count : ''} {reacted ? 'Clapped' : 'Clap'}
        </button>
        <button onClick={bookmark} className={'article-action' + (bookmarked ? ' is-clapped' : '')}>
          <Bookmark size={15} /> {bookmarked ? 'Saved' : 'Save'}
        </button>
        <button onClick={() => setShareOpen(true)} className="article-action">
          <Share2 size={15} /> Share
        </button>
      </div>

      {shareOpen && (
        <div className="share-modal-backdrop" onClick={e => e.target === e.currentTarget && setShareOpen(false)}>
          <div className="share-modal">
            <button onClick={() => setShareOpen(false)} className="share-close"><X size={16} /></button>
            <p className="kicker">Share this story</p>
            <h3 className="section-title" style={{ fontSize:24, marginTop:8 }}>{title}</h3>

            {/* Share card preview */}
            <div className="share-card-preview" style={{ backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined, backgroundSize:'cover', backgroundPosition:'center' }}>
              <div>
                <span>{categoryName}</span>
                <strong>{title}</strong>
                <small>insight.citiplug.com</small>
              </div>
            </div>

            <div className="share-grid">
              <a href={'https://wa.me/?text=' + msg} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
              <a href={'https://twitter.com/intent/tweet?text=' + msg} target="_blank" rel="noopener noreferrer">𝕏 Twitter</a>
              <a href={'https://www.facebook.com/sharer/sharer.php?u=' + enc(url)} target="_blank" rel="noopener noreferrer">📘 Facebook</a>
              <a href={'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title)} target="_blank" rel="noopener noreferrer">✈️ Telegram</a>
            </div>
            <div className="share-modal-actions">
              <button onClick={copyLink} className="btn btn-dark" style={{ width:'100%', justifyContent:'center' }}>🔗 Copy Link</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}