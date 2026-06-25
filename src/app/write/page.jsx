'use client'
import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { toast } from 'sonner'
import {
  ArrowLeft, Bold, Italic, Underline, List, ListOrdered, Quote,
  Heading2, Heading3, ImagePlus, Save, Send, Eye,
  Link as LinkIcon, AlignCenter, Undo2, Redo2, Minus, Type, X
} from 'lucide-react'

// Categories loaded from insight_categories
function Writer() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const sp = useSearchParams()
  const editId = sp.get('edit')
  const editorRef = useRef(null)
  const inlineImgRef = useRef(null)

  const [title, setTitle]           = useState('')
  const [excerpt, setExcerpt]       = useState('')
  const [categoryId, setCategoryId] = useState('')  // uuid
  const [categories, setCategories] = useState([])  // from insight_categories
  const [tags, setTags]             = useState('')   // comma-separated tag names
  const [coverUrl, setCoverUrl]     = useState('')
  const [seoTitle, setSeoTitle]     = useState('')
  const [seoDesc, setSeoDesc]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [preview, setPreview]       = useState(false)
  const [wordCount, setWordCount]   = useState(0)
  const [charCount, setCharCount]   = useState(0)

  // Load categories from insight_categories
  useEffect(() => {
    supabase.from('insight_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data?.length) { setCategories(data); setCategoryId(data[0].id) }
      })
  }, [])

  // Load existing post if editing
  useEffect(() => {
    if (!editId || !user) return
    supabase.from('insight_posts')
      .select('*, category:insight_categories!insight_posts_category_fkey(id,name)')
      .eq('id', editId).eq('author_id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        setTitle(data.title || '')
        setExcerpt(data.excerpt || '')
        setCoverUrl(data.cover_image_url || '')
        setSeoTitle(data.seo_title || '')
        setSeoDesc(data.seo_description || '')
        if (data.category?.id) setCategoryId(data.category.id)
        // Load tags from insight_post_tags
        supabase.from('insight_post_tags')
          .select('tag:insight_tags!insight_post_tags_tag_id_fkey(name)')
          .eq('post_id', editId)
          .then(({ data: tagRows }) => {
            if (tagRows) setTags(tagRows.map(r => r.tag?.name).filter(Boolean).join(', '))
          })
        // Restore content into editor
        setTimeout(() => {
          if (editorRef.current && data.content) {
            // content is jsonb — render as HTML for the contentEditable editor
            if (typeof data.content === 'string') editorRef.current.innerHTML = data.content
            else if (data.content?.type === 'doc') {
              // Simple HTML extraction from ProseMirror JSON for editing
              editorRef.current.innerHTML = contentJsonToEditHtml(data.content)
            }
            updateCount()
          }
        }, 100)
      })
  }, [editId, user])

  // Convert jsonb doc to editable HTML (simplified for contentEditable)
  const contentJsonToEditHtml = (doc) => {
    const nodeToHtml = (node) => {
      if (!node) return ''
      if (node.type === 'text') {
        let t = node.text || ''
        if (node.marks) node.marks.forEach(m => {
          if (m.type === 'bold')   t = '<strong>' + t + '</strong>'
          if (m.type === 'italic') t = '<em>' + t + '</em>'
          if (m.type === 'link')   t = '<a href="' + m.attrs?.href + '">' + t + '</a>'
        })
        return t
      }
      const inner = (node.content || []).map(nodeToHtml).join('')
      switch (node.type) {
        case 'paragraph':  return '<p>' + inner + '</p>'
        case 'heading':    return '<h' + (node.attrs?.level||2) + '>' + inner + '</h' + (node.attrs?.level||2) + '>'
        case 'blockquote': return '<blockquote>' + inner + '</blockquote>'
        case 'bulletList': return '<ul>' + inner + '</ul>'
        case 'orderedList':return '<ol>' + inner + '</ol>'
        case 'listItem':   return '<li>' + inner + '</li>'
        case 'hardBreak':  return '<br>'
        case 'image':      return '<img src="' + node.attrs?.src + '" alt="' + (node.attrs?.alt||'') + '">'
        default:           return inner
      }
    }
    return (doc.content || []).map(nodeToHtml).join('')
  }

  // Convert contentEditable HTML to ProseMirror-compatible jsonb
  const htmlToContentJson = (html) => {
    // Store as a simple jsonb object with html string for now
    // This avoids complex DOM parsing while keeping jsonb structure
    return { type: 'doc', html: html, content: [{ type: 'paragraph', content: [{ type: 'text', text: html.replace(/<[^>]+>/g, ' ').trim() }] }] }
  }

  const updateCount = () => {
    const text = editorRef.current?.innerText || ''
    setCharCount(text.length)
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0)
  }

  const cmd = (c, v = null) => { document.execCommand(c, false, v); editorRef.current?.focus(); updateCount() }

  const upload = async (file, prefix = 'insight') => {
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg'
    const name = prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
    const { error } = await supabase.storage.from('place-images').upload(name, file, { contentType: file.type, upsert: true })
    if (error) throw error
    return supabase.storage.from('place-images').getPublicUrl(name).data.publicUrl
  }

  const uploadCover = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try { setCoverUrl(await upload(file, 'insight-cover')); toast.success('Cover uploaded') }
    catch (err) { toast.error(err.message) }
    setUploading(false); e.target.value = ''
  }

  const uploadInline = async e => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const url = await upload(file, 'insight-inline')
      const caption = prompt('Caption (optional)') || ''
      cmd('insertHTML', '<figure class="story-image"><img src="' + url + '" alt="' + caption + '"><figcaption>' + caption + '</figcaption></figure><p><br></p>')
      toast.success('Image added')
    } catch (err) { toast.error(err.message) }
    e.target.value = ''
  }

  const resolveOrCreateTag = async (tagName) => {
    const clean = tagName.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    if (!clean) return null
    const { data: existing } = await supabase.from('insight_tags').select('id').eq('slug', clean).maybeSingle()
    if (existing) return existing.id
    const { data: created, error } = await supabase.from('insight_tags').insert({ name: tagName.trim(), slug: clean }).select('id').single()
    if (error) return null
    return created.id
  }

  const save = async (publish = false) => {
    if (!title.trim()) return toast.error('Add a headline')
    if (!user) return toast.error('Sign in first')
    const html = editorRef.current?.innerHTML || ''
    const plain = editorRef.current?.innerText?.trim() || ''
    if (publish && plain.length < 80) return toast.error('Story is too short to publish')

    setSaving(true)
    try {
      const slugBase = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 70)
      const slug = editId ? undefined : slugBase + '-' + Date.now()

      // content stored as jsonb — wrapping HTML in our structure
      const contentJson = htmlToContentJson(html)

      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: contentJson,                    // jsonb — real column
        cover_image_url: coverUrl,               // real column
        category: categoryId || null,            // uuid FK to insight_categories
        author_id: user.id,
        status: publish ? 'published' : 'draft',
        visibility: 'public',
        published_at: publish ? new Date().toISOString() : null,
        seo_title: (seoTitle || title).trim(),
        seo_description: (seoDesc || excerpt).trim(),
      }
      if (slug) payload.slug = slug

      let postId = editId
      let error

      if (editId) {
        ({ error } = await supabase.from('insight_posts').update(payload).eq('id', editId))
      } else {
        const { data: created, error: insertErr } = await supabase.from('insight_posts').insert(payload).select('id').single()
        error = insertErr
        postId = created?.id
      }
      if (error) throw error

      // Handle tags — resolve/create in insight_tags then link via insight_post_tags
      if (postId && tags.trim()) {
        const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean)
        const tagIds = (await Promise.all(tagNames.map(resolveOrCreateTag))).filter(Boolean)
        // Remove old tag links
        await supabase.from('insight_post_tags').delete().eq('post_id', postId)
        // Insert new ones
        if (tagIds.length) {
          await supabase.from('insight_post_tags').insert(tagIds.map(tag_id => ({ post_id: postId, tag_id })))
        }
      }

      toast.success(publish ? 'Published!' : 'Draft saved')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Could not save')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding:80, textAlign:'center' }}>Loading writer...</div>
  if (!isAuthenticated) return (
    <div className="container" style={{ padding:'80px 0', textAlign:'center' }}>
      <h1 className="section-title" style={{ fontSize:42 }}>Sign in to write.</h1>
      <a className="btn btn-dark" href="/login">Sign In</a>
    </div>
  )

  const labelStyle = { display:'block', fontSize:12, fontWeight:900, color:'var(--muted)', marginTop:14 }
  const inputStyle = { width:'100%', border:'1px solid var(--line)', borderRadius:14, height:44, padding:'0 12px', outline:0, marginTop:7, background:'#fff', fontFamily:'var(--sans)', fontSize:14 }

  return (
    <div className="container write-wrap">
      {/* Top bar */}
      <div className="write-top">
        <button onClick={() => router.back()} className="btn btn-soft"><ArrowLeft size={16} />Back</button>
        <div className="write-actions">
          <button onClick={() => setPreview(p => !p)} className="btn btn-soft"><Eye size={16} />{preview ? 'Edit' : 'Preview'}</button>
          <button onClick={() => save(false)} disabled={saving} className="btn btn-soft"><Save size={16} />{saving ? 'Saving...' : 'Save draft'}</button>
          <button onClick={() => save(true)} disabled={saving} className="btn btn-dark"><Send size={16} />Publish</button>
        </div>
      </div>

      <div className="writer-grid">
        <main>
          {/* Title & deck */}
          <div className="premium-card title-card">
            <p className="kicker">Insight Writer Studio</p>
            <textarea value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Write a headline with magazine weight..." rows={2} className="headline-input" />
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="Short deck / subtitle — also used for SEO description..." rows={2} className="deck-input" />
          </div>

          {/* Cover image */}
          {coverUrl
            ? <div className="cover-preview">
                <img src={coverUrl} />
                <button onClick={() => setCoverUrl('')}><X size={14} /> Remove</button>
              </div>
            : <label className="premium-card cover-upload">
                <span><ImagePlus size={22} />{uploading ? 'Uploading...' : 'Upload cover image'}</span>
                <input type="file" accept="image/*" onChange={uploadCover} />
              </label>
          }

          {/* Toolbar */}
          <div className="premium-card rich-toolbar">
            <button className="tool-btn" onClick={() => cmd('formatBlock','P')} title="Paragraph"><Type size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('formatBlock','H2')} title="Heading 2"><Heading2 size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('formatBlock','H3')} title="Heading 3"><Heading3 size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('bold')} title="Bold"><Bold size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('italic')} title="Italic"><Italic size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('underline')} title="Underline"><Underline size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('insertUnorderedList')} title="Bullet list"><List size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('insertOrderedList')} title="Numbered list"><ListOrdered size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('formatBlock','BLOCKQUOTE')} title="Quote"><Quote size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('justifyCenter')} title="Center"><AlignCenter size={16} /></button>
            <button className="tool-btn" onClick={() => { const u = prompt('Link URL'); if(u) cmd('createLink',u) }} title="Link"><LinkIcon size={16} /></button>
            <button className="tool-btn image-tool" onClick={() => inlineImgRef.current?.click()} title="Upload image"><ImagePlus size={16} />Image</button>
            <button className="tool-btn" onClick={() => cmd('insertHTML','<hr class="story-divider"/>')} title="Divider"><Minus size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('undo')} title="Undo"><Undo2 size={16} /></button>
            <button className="tool-btn" onClick={() => cmd('redo')} title="Redo"><Redo2 size={16} /></button>
            <input ref={inlineImgRef} type="file" accept="image/*" onChange={uploadInline} style={{ display:'none' }} />
          </div>

          {/* Editor */}
          {preview
            ? <article className="article-body premium-card preview-card"
                dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '<p>No content yet.</p>' }} />
            : <div ref={editorRef} onInput={updateCount} onBlur={updateCount}
                className="editor-surface" contentEditable suppressContentEditableWarning
                data-placeholder="Start writing your story..." />
          }
        </main>

        <aside className="write-aside">
          {/* Category — from insight_categories */}
          <div className="premium-card side-panel">
            <p className="kicker">Category</p>
            <p style={{ fontSize:12, color:'var(--muted)', margin:'6px 0 10px' }}>Select the primary category for this story.</p>
            {categories.length === 0
              ? <p style={{ fontSize:12, color:'var(--muted)' }}>Loading categories...</p>
              : <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  style={{ ...inputStyle, height:'auto', padding:'10px 12px', cursor:'pointer' }}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            }
          </div>

          {/* Tags — stored in insight_post_tags */}
          <div className="premium-card side-panel">
            <p className="kicker">Tags</p>
            <p style={{ fontSize:12, color:'var(--muted)', margin:'6px 0 10px' }}>
              Comma-separated. New tags are created automatically in <code>insight_tags</code>.
            </p>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="Culture, Campus, Startups" style={inputStyle} />
          </div>

          {/* SEO */}
          <div className="premium-card side-panel">
            <p className="kicker">SEO</p>
            <label style={labelStyle}>SEO Title</label>
            <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="Defaults to headline" style={inputStyle} />
            <label style={labelStyle}>Meta description</label>
            <textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)}
              placeholder="150–160 character summary for search engines"
              style={{ ...inputStyle, height:80, paddingTop:10 }} />
          </div>

          {/* Editorial health */}
          <div className="premium-card health-card">
            <p className="kicker">Editorial health</p>
            <div className="health-metrics">
              <b>{wordCount}</b><span>words</span>
              <b>{charCount}</b><span>chars</span>
            </div>
            <div><i style={{ width: Math.min(100, (charCount/2500)*100) + '%' }} /></div>
            <p>Aim for 2,500+ characters for a proper feature.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div style={{ padding:80, textAlign:'center' }}>Loading...</div>}>
      <Writer />
    </Suspense>
  )
}