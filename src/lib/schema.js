// ╔══════════════════════════════════════════════════════════════════╗
// ║  REAL SUPABASE SCHEMA — verified from information_schema query   ║
// ║  DO NOT use body, cover_image, category (text), categories[]    ║
// ╚══════════════════════════════════════════════════════════════════╝

// insight_posts real columns:
// id, author_id, category (uuid FK → insight_categories.id),
// title, slug, excerpt, content (jsonb), cover_image_url, status,
// visibility, is_featured, seo_title, seo_description, canonical_url,
// published_at, created_at, updated_at

// insight_categories: id, name, slug, description, is_active, sort_order, created_at
// insight_tags: id, name, slug, created_at
// insight_post_tags: post_id, tag_id  (no id column)
// insight_comments: id, post_id, user_id, body, status, created_at
// insight_reactions: post_id, user_id, reaction, created_at  (no id)
// insight_bookmarks: post_id, user_id, created_at  (no id)
// insight_views: id, post_id, user_id, session_id, ip_hash, referrer, created_at

export const POST_FIELDS = [
  'id', 'title', 'slug', 'excerpt', 'content',
  'cover_image_url', 'status', 'visibility', 'is_featured',
  'published_at', 'created_at', 'author_id',
  'seo_title', 'seo_description',
  'category:insight_categories!insight_posts_category_fkey(id,name,slug)',
].join(',')

// Extract plain text from jsonb content for previews
export function contentToText(content) {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object') {
    // TipTap / ProseMirror JSON format
    if (Array.isArray(content.content)) {
      return content.content
        .flatMap(node => {
          if (node.type === 'text') return node.text || ''
          if (node.content) return contentToText({ content: node.content })
          return ''
        })
        .join(' ')
        .trim()
    }
    // Fallback: stringify
    return JSON.stringify(content)
  }
  return String(content)
}

// Convert jsonb content back to HTML for article reader
export function contentToHtml(content) {
  if (!content) return ''
  if (typeof content === 'string') return content

  function nodeToHtml(node) {
    if (!node) return ''
    if (node.type === 'text') {
      let t = (node.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      if (node.marks) {
        node.marks.forEach(m => {
          if (m.type === 'bold')   t = '<strong>' + t + '</strong>'
          if (m.type === 'italic') t = '<em>' + t + '</em>'
          if (m.type === 'link')   t = '<a href="' + m.attrs?.href + '" target="_blank" rel="noopener">' + t + '</a>'
          if (m.type === 'code')   t = '<code>' + t + '</code>'
        })
      }
      return t
    }
    const inner = (node.content || []).map(nodeToHtml).join('')
    switch (node.type) {
      case 'paragraph':      return '<p>' + (inner || '<br>') + '</p>'
      case 'heading':        return '<h' + (node.attrs?.level||2) + '>' + inner + '</h' + (node.attrs?.level||2) + '>'
      case 'blockquote':     return '<blockquote>' + inner + '</blockquote>'
      case 'bulletList':     return '<ul>' + inner + '</ul>'
      case 'orderedList':    return '<ol>' + inner + '</ol>'
      case 'listItem':       return '<li>' + inner + '</li>'
      case 'horizontalRule': return '<hr class="story-divider">'
      case 'hardBreak':      return '<br>'
      case 'image':          return '<figure class="story-image"><img src="' + node.attrs?.src + '" alt="' + (node.attrs?.alt||'') + '"><figcaption>' + (node.attrs?.title||'') + '</figcaption></figure>'
      case 'codeBlock':      return '<pre><code>' + inner + '</code></pre>'
      case 'doc':            return inner
      default:               return inner
    }
  }

  if (typeof content === 'object' && content.type === 'doc') {
    return nodeToHtml(content)
  }
  return nodeToHtml({ type: 'doc', content: Array.isArray(content) ? content : [content] })
}

// Slugify author name for URL
export const slugifyAuthor = s =>
  String(s || 'writer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '') || 'writer'

export const timeAgo = d => {
  if (!d) return ''
  const ms = Date.now() - new Date(d)
  if (ms < 3600000)   return Math.max(1, Math.floor(ms / 60000)) + 'm ago'
  if (ms < 86400000)  return Math.floor(ms / 3600000) + 'h ago'
  return Math.max(1, Math.floor(ms / 86400000)) + 'd ago'
}

export const readTime = content => {
  const words = contentToText(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200)) + ' min read'
}