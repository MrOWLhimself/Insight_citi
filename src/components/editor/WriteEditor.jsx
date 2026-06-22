'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlock from '@tiptap/extension-code-block'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { slugify, readTime, CATEGORIES } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Bold, Italic, Underline as UnderlineIcon, Highlighter,
  Heading1, Heading2, Heading3, Quote, Code2, Code,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  ImageIcon, LinkIcon, Minus, Save, Send, X, Loader2,
  ChevronRight, Eye, Clock, Hash, Camera, Feather,
  MoreHorizontal, Type, Pilcrow
} from 'lucide-react'

// ── Auto-resize textarea hook ──
function useAutoResize(ref) {
  const resize = useCallback(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
  }, [ref])
  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])
  return resize
}

// ── Format bytes ──
function readTimeStr(editor) {
  if (!editor) return '1 min'
  const words = editor.storage?.characterCount?.words() || 0
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

// ── Floating bubble toolbar button ──
function BubbleBtn({ onClick, active, title, children }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`float-btn ${active ? 'active' : ''}`} title={title}>
      {children}
    </button>
  )
}

// ── Block insert menu ──
const BLOCK_TYPES = [
  { icon: Type, label: 'Text', desc: 'Start writing plain text', action: e => e.chain().focus().setParagraph().run() },
  { icon: Heading1, label: 'Heading 1', desc: 'Big section heading', action: e => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { icon: Heading2, label: 'Heading 2', desc: 'Medium section heading', action: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { icon: Heading3, label: 'Heading 3', desc: 'Small section heading', action: e => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { icon: Quote, label: 'Quote', desc: 'Pull quote or blockquote', action: e => e.chain().focus().toggleBlockquote().run() },
  { icon: List, label: 'Bullet List', desc: 'Unordered list', action: e => e.chain().focus().toggleBulletList().run() },
  { icon: ListOrdered, label: 'Numbered List', desc: 'Ordered list', action: e => e.chain().focus().toggleOrderedList().run() },
  { icon: Code2, label: 'Code Block', desc: 'Code snippet', action: e => e.chain().focus().toggleCodeBlock().run() },
  { icon: Minus, label: 'Divider', desc: 'Section separator · · ·', action: e => e.chain().focus().setHorizontalRule().run() },
]

// ── Publish settings modal ──
function PublishModal({ open, onClose, onPublish, publishing, category, setCategory, tags, setTags, coverImage, setCoverImage, uploadingCover }) {
  const [tagInput, setTagInput] = useState('')
  const fileRef = useRef()

  const addTag = e => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
      if (!tags.includes(t) && tags.length < 5) setTags(p => [...p, t])
      setTagInput('')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-serif font-bold text-lg text-gray-900">Story settings</h3>
            <p className="text-xs text-gray-400 mt-0.5">Review before publishing</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Cover image */}
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: '21/9' }}>
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 bg-white/90 rounded-xl text-xs font-semibold text-gray-700 hover:bg-white">
                  Change cover
                </button>
                <button type="button" onClick={() => setCoverImage('')}
                  className="px-3 py-1.5 bg-red-500/90 text-white rounded-xl text-xs font-semibold hover:bg-red-600">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="cover-upload-zone cursor-pointer" onClick={() => fileRef.current?.click()}>
              {uploadingCover ? (
                <Loader2 size={24} className="text-orange-400 animate-spin" />
              ) : (
                <>
                  <Camera size={24} className="text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">Add a cover image</p>
                  <p className="text-xs text-gray-300">Recommended 1400 × 600px</p>
                </>
              )}
            </label>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
            const file = e.target.files?.[0]
            if (file) window.uploadCoverFromModal?.(file)
          }} />

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {CATEGORIES.map(c => (
                <button key={c.slug} type="button" onClick={() => setCategory(c.slug)}
                  className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    category === c.slug
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Tags <span className="text-gray-300 font-normal normal-case">(up to 5)</span>
            </label>
            <div className="border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-orange-400 transition-colors min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    #{tag}
                    <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))}
                      className="hover:text-red-400 transition-colors ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                placeholder={tags.length < 5 ? 'Add tag, press Enter…' : 'Max 5 tags reached'}
                disabled={tags.length >= 5}
                className="w-full text-sm outline-none bg-transparent text-gray-700 placeholder-gray-300" />
            </div>
          </div>
        </div>

        {/* Publish button */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onPublish} disabled={publishing}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {publishing ? <><Loader2 size={18} className="animate-spin" />Publishing…</> : <><Feather size={16} />Publish story</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN WRITE COMPONENT
// ─────────────────────────────────────────────
export default function Write() {
  const params = useParams()
  const id = params?.id
  const { user, profile, isAuthenticated } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [category, setCategory] = useState('personal')
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [articleId, setArticleId] = useState(id || null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [blockMenuPos, setBlockMenuPos] = useState({ x: 0, y: 0 })
  const [lastSaved, setLastSaved] = useState(null)
  const [isDirty, setIsDirty] = useState(false)

  const titleRef = useRef()
  const subtitleRef = useRef()
  const fileInputRef = useRef()
  const autoSaveRef = useRef()
  const blockMenuRef = useRef()

  useAutoResize(titleRef)
  useAutoResize(subtitleRef)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      CodeBlock,
      Image.configure({ inline: false, allowBase64: false }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Typography,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading…'
          return 'Tell your story… (type / for commands)'
        },
      }),
    ],
    editorProps: {
      attributes: { class: 'tiptap-modern' },
      handleKeyDown: (view, event) => {
        // Slash command
        if (event.key === '/') {
          const selection = view.state.selection
          const { $from } = selection
          if ($from.parent.textContent === '') {
            event.preventDefault()
            setShowBlockMenu(true)
            const coords = view.coordsAtPos($from.pos)
            setBlockMenuPos({ x: coords.left, y: coords.bottom + window.scrollY })
            return true
          }
        }
        if (event.key === 'Escape') { setShowBlockMenu(false); return false }
        return false
      }
    },
    onUpdate: () => { setIsDirty(true) },
  })

  // Expose cover upload for modal
  useEffect(() => {
    window.uploadCoverFromModal = async (file) => {
      if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
      setUploadingCover(true)
      const ext = file.name.split('.').pop()
      const name = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('insight-images').upload(name, file, { contentType: file.type })
      if (error) { toast.error('Upload failed'); setUploadingCover(false); return }
      const { data: { publicUrl } } = supabase.storage.from('insight-images').getPublicUrl(name)
      setCoverImage(publicUrl)
      setUploadingCover(false)
    }
    return () => { delete window.uploadCoverFromModal }
  }, [])

  // Load draft if editing
  useEffect(() => {
    if (!id || !editor) return
    supabase.from('inkwell_articles').select('*').eq('id', id).eq('author_id', user?.id).single()
      .then(({ data }) => {
        if (!data) return
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
        setCoverImage(data.cover_image || '')
        setCategory(data.category || 'personal')
        setTags(data.tags || [])
        if (data.body) editor.commands.setContent(data.body)
      })
  }, [id, editor])

  // Auto-save every 30s
  useEffect(() => {
    if (!editor) return
    autoSaveRef.current = setInterval(() => {
      if (title.trim() && articleId && isDirty) {
        silentSave()
      }
    }, 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [editor, title, articleId, isDirty])

  // Close block menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (blockMenuRef.current && !blockMenuRef.current.contains(e.target)) {
        setShowBlockMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const silentSave = async () => {
    if (!isAuthenticated || !title.trim()) return
    const body = editor.getJSON()
    const slug = slugify(title) + '-' + Date.now().toString(36).slice(-4)
    const payload = {
      title: title.trim(), subtitle: subtitle.trim(), body, cover_image: coverImage,
      category, tags, status: 'draft', author_id: user.id,
      read_time: parseInt(readTime(body)), updated_at: new Date().toISOString()
    }
    if (articleId) {
      await supabase.from('inkwell_articles').update(payload).eq('id', articleId)
    } else {
      const { data } = await supabase.from('inkwell_articles').insert({ ...payload, slug }).select().single()
      if (data) { setArticleId(data.id); router.replace(`/write/${data.id}`) }
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error('Sign in to save'); return }
    if (!title.trim()) { toast.error('Add a title first'); return }
    setSaving(true)
    await silentSave()
    setSaving(false)
    toast.success('Draft saved!')
  }

  const handlePublish = async () => {
    if (!isAuthenticated) { toast.error('Sign in first'); return }
    if (!title.trim()) { toast.error('Add a title'); return }
    if (!editor.getText().trim()) { toast.error('Write something first'); return }
    setPublishing(true)

    const body = editor.getJSON()
    const baseSlug = slugify(title)
    const slug = articleId ? undefined : baseSlug + '-' + Date.now().toString(36).slice(-4)
    const payload = {
      title: title.trim(), subtitle: subtitle.trim(), body, cover_image: coverImage,
      category, tags, status: 'published', author_id: user.id,
      read_time: parseInt(readTime(body)),
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    if (slug) payload.slug = slug

    const username = profile?.username || user.email.split('@')[0]

    if (articleId) {
      const { data, error } = await supabase.from('inkwell_articles').update(payload).eq('id', articleId).select().single()
      if (error) { toast.error(error.message); setPublishing(false); return }
      toast.success('Published! 🎉'); router.push(`/@${username}/${data.slug}`)
    } else {
      const { data, error } = await supabase.from('inkwell_articles').insert(payload).select().single()
      if (error) { toast.error(error.message); setPublishing(false); return }
      toast.success('Published! 🎉'); router.push(`/@${username}/${data.slug}`)
    }
    setPublishing(false)
    setShowPublishModal(false)
  }

  const uploadInlineImage = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]; if (!file) return
      const ext = file.name.split('.').pop()
      const name = `inline/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('insight-images').upload(name, file, { contentType: file.type })
      if (error) { toast.error('Upload failed'); return }
      const { data: { publicUrl } } = supabase.storage.from('insight-images').getPublicUrl(name)
      editor.chain().focus().setImage({ src: publicUrl }).run()
    }
    input.click()
  }

  const setLink = () => {
    const url = prompt('Enter URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const wordCount = editor?.storage.characterCount?.words() || 0

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-2xl text-gray-800 mb-4">Sign in to write</p>
        <Link to="/login" className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-serif font-bold text-gray-900 hover:text-orange-500 transition-colors text-lg">
            Insight
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />}
            {lastSaved && !isDirty
              ? <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              : wordCount > 0 ? <span>{wordCount} words · {readTimeStr(editor)}</span> : <span>Draft</span>
            }
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-500 border border-gray-200 rounded-full hover:border-gray-400 transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span className="hidden sm:inline">Save</span>
            </button>
            <button onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-semibold transition-colors">
              <Feather size={13} />
              <span>Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Editor area ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Cover image */}
        {coverImage ? (
          <div className="relative mb-10 rounded-2xl overflow-hidden group" style={{ aspectRatio: '21/9' }}>
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/95 text-gray-800 rounded-full text-sm font-semibold shadow-lg hover:bg-white transition-colors">
                <Camera size={14} /> Change
              </button>
              <button type="button" onClick={() => setCoverImage('')}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/95 text-white rounded-full text-sm font-semibold shadow-lg hover:bg-red-600 transition-colors">
                <X size={14} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="cover-upload-zone mb-8 w-full group">
            {uploadingCover
              ? <Loader2 size={20} className="text-orange-400 animate-spin" />
              : <>
                  <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                    <Camera size={18} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <p className="text-sm text-gray-400 group-hover:text-orange-500 font-medium transition-colors">Add a cover image</p>
                  <p className="text-xs text-gray-300">JPG, PNG · Max 5MB · Recommended 1400 × 600</p>
                </>
            }
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0]; if (!file) return
            if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
            setUploadingCover(true)
            const ext = file.name.split('.').pop()
            const name = `covers/${Date.now()}.${ext}`
            const { error } = await supabase.storage.from('insight-images').upload(name, file, { contentType: file.type })
            if (error) { toast.error('Upload failed'); setUploadingCover(false); return }
            const { data: { publicUrl } } = supabase.storage.from('insight-images').getPublicUrl(name)
            setCoverImage(publicUrl); setUploadingCover(false)
          }}
        />

        {/* Title */}
        <textarea ref={titleRef} value={title} onChange={e => { setTitle(e.target.value.slice(0, 120)); setIsDirty(true) }}
          placeholder="Your story title…"
          className="inkwell-title w-full mb-4"
          rows={1}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); subtitleRef.current?.focus() } }}
        />

        {/* Subtitle / lead */}
        <textarea ref={subtitleRef} value={subtitle} onChange={e => { setSubtitle(e.target.value); setIsDirty(true) }}
          placeholder="Add a subtitle or lead sentence… (optional)"
          className="inkwell-subtitle w-full mb-8"
          rows={1}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus() } }}
        />

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-100" />
          <div className="flex items-center gap-2 text-gray-300 text-xs">
            <Feather size={12} />
            <span>Start writing below · type / for blocks</span>
          </div>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* ── Bubble / floating format toolbar ── */}
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 150, placement: 'top' }}>
            <div className="floating-toolbar">
              <BubbleBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                <Bold size={13} />
              </BubbleBtn>
              <BubbleBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                <Italic size={13} />
              </BubbleBtn>
              <BubbleBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                <UnderlineIcon size={13} />
              </BubbleBtn>
              <BubbleBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                <Highlighter size={13} />
              </BubbleBtn>
              <div className="float-sep" />
              <BubbleBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                <span className="text-[11px] font-bold">H1</span>
              </BubbleBtn>
              <BubbleBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                <span className="text-[11px] font-bold">H2</span>
              </BubbleBtn>
              <div className="float-sep" />
              <BubbleBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                <Quote size={13} />
              </BubbleBtn>
              <BubbleBtn onClick={setLink} active={editor.isActive('link')} title="Link">
                <LinkIcon size={13} />
              </BubbleBtn>
              <BubbleBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
                <Code size={13} />
              </BubbleBtn>
              <div className="float-sep" />
              <BubbleBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
                <AlignLeft size={13} />
              </BubbleBtn>
              <BubbleBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
                <AlignCenter size={13} />
              </BubbleBtn>
            </div>
          </BubbleMenu>
        )}

        {/* ── Slash command block menu ── */}
        {showBlockMenu && (
          <div ref={blockMenuRef}
            className="fixed z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 w-72 overflow-hidden"
            style={{ top: blockMenuPos.y + 8, left: Math.max(16, blockMenuPos.x - 16) }}>
            <div className="px-3 py-1.5 mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Insert block</p>
            </div>
            {BLOCK_TYPES.map(block => (
              <button key={block.label} onMouseDown={e => { e.preventDefault(); block.action(editor); setShowBlockMenu(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <block.icon size={15} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{block.label}</p>
                  <p className="text-xs text-gray-400">{block.desc}</p>
                </div>
              </button>
            ))}
            <div className="px-3 pt-2 pb-1 border-t border-gray-100 mt-1">
              <button onMouseDown={e => { e.preventDefault(); uploadInlineImage(); setShowBlockMenu(false) }}
                className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-xl transition-colors px-1">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ImageIcon size={15} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Image</p>
                  <p className="text-xs text-gray-400">Upload from your device</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Tiptap editor ── */}
        <div className="min-h-[400px] pb-32" onClick={() => editor?.commands.focus()}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Word count badge ── */}
      {wordCount > 0 && (
        <div className="word-count-badge">
          {wordCount} words · {readTimeStr(editor)}
        </div>
      )}

      {/* ── Publish modal ── */}
      <PublishModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
        publishing={publishing}
        category={category}
        setCategory={setCategory}
        tags={tags}
        setTags={setTags}
        coverImage={coverImage}
        setCoverImage={setCoverImage}
        uploadingCover={uploadingCover}
      />
    </div>
  )
}
