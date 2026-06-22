export const cn = (...c) => c.filter(Boolean).join(' ')

export function readTime(content) {
  const text = typeof content === 'string' ? content : JSON.stringify(content || '')
  return `${Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 200))} min read`
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })
}

export function extractText(json) {
  if (!json) return ''
  if (typeof json === 'string') return json
  const walk = n => n.type === 'text' ? (n.text || '') : (n.content ? n.content.map(walk).join(' ') : '')
  return walk(json).replace(/\s+/g, ' ').trim().slice(0, 300)
}

export const CATEGORIES = [
  {slug:'news',label:'News'},{slug:'lifestyle',label:'Lifestyle'},
  {slug:'culture',label:'Culture'},{slug:'opinion',label:'Opinion'},
  {slug:'tech',label:'Tech'},{slug:'sports',label:'Sports'},
  {slug:'business',label:'Business'},{slug:'entertainment',label:'Entertainment'},
  {slug:'health',label:'Health'},{slug:'politics',label:'Politics'},
  {slug:'fashion',label:'Fashion'},{slug:'food',label:'Food'},
  {slug:'personal',label:'Personal Essays'},{slug:'travel',label:'Travel'},
]

export const CAT_COLORS = {
  news:'#1a1a1a', lifestyle:'#f97316', culture:'#ea580c', opinion:'#7c3aed',
  tech:'#0369a1', sports:'#dc2626', business:'#b45309', entertainment:'#9333ea',
  health:'#16a34a', politics:'#b91c1c', fashion:'#f97316', food:'#d97706',
  personal:'#6b7280', travel:'#0891b2',
}

export const getCategoryLabel = slug => CATEGORIES.find(c => c.slug === slug)?.label || slug
export const getCategoryColor = slug => CAT_COLORS[slug] || '#1a1a1a'
