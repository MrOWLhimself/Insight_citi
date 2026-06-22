import Link from 'next/link'
import Image from 'next/image'
import { timeAgo, getCategoryLabel, getCategoryColor, extractText, readTime } from '@/lib/utils'
import { HandMetal, MessageCircle, Clock } from 'lucide-react'

const CAT_BG = {
  news:'#f3f4f6', lifestyle:'#fff7ed', culture:'#fff7ed', opinion:'#f5f3ff',
  tech:'#e0f2fe', sports:'#fef2f2', business:'#fffbeb', entertainment:'#faf5ff',
  health:'#f0fdf4', politics:'#fef2f2', fashion:'#fff7ed', food:'#fffbeb',
  personal:'#f9fafb', travel:'#e0f7fa',
}

function CategoryBadge({ category }) {
  const color = getCategoryColor(category)
  const bg = CAT_BG[category] || '#f9fafb'
  return (
    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"
      style={{ color, background: bg }}>
      {getCategoryLabel(category)}
    </span>
  )
}

export function AuthorAvatar({ author, size = 'sm' }) {
  const sizes = { xs:'w-5 h-5 text-[9px]', sm:'w-7 h-7 text-[11px]', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-base' }
  const name = author?.full_name || author?.email || 'A'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  return (
    <div className={`${sizes[size]} rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden`}>
      {author?.avatar_url
        ? <img src={author.avatar_url} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  )
}

export default function ArticleCard({ article, variant = 'default' }) {
  const { title, cover_image, category, published_at, clap_count, comment_count, body, author, slug } = article
  const username = author?.username || author?.email?.split('@')[0] || 'writer'
  const excerpt = extractText(body)
  const rt = readTime(body)
  const href = `/@${username}/${slug}`

  if (variant === 'hero') {
    return (
      <Link href={href} className="group block">
        {cover_image ? (
          <div className="w-full h-[260px] rounded-2xl overflow-hidden mb-5 bg-ink-100">
            <img src={cover_image} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          </div>
        ) : (
          <div className="w-full h-[260px] rounded-2xl mb-5 bg-ink-900 flex items-end p-6" />
        )}
        <CategoryBadge category={category} />
        <h2 style={{ fontFamily: 'Lora, serif' }} className="text-[28px] font-bold text-ink-900 leading-tight mb-3 group-hover:text-orange-500 transition-colors line-clamp-3 mt-3">
          {title}
        </h2>
        {excerpt && <p className="text-ink-500 leading-relaxed mb-4 line-clamp-3 text-[15px]">{excerpt}</p>}
        <div className="flex items-center gap-3">
          <AuthorAvatar author={author} size="sm" />
          <div>
            <p className="text-[13px] font-semibold text-ink-800">{author?.full_name || username}</p>
            <div className="flex items-center gap-2 text-[11px] text-ink-400">
              <span>{timeAgo(published_at)}</span>
              <span>·</span>
              <span>{rt}</span>
              {clap_count > 0 && <><span>·</span><span className="flex items-center gap-1"><HandMetal size={10} />{clap_count}</span></>}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={href} className="group flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <AuthorAvatar author={author} size="xs" />
            <span className="text-[11px] text-ink-400 font-medium">{author?.full_name || username}</span>
            <span className="text-[11px] text-ink-300">· {timeAgo(published_at)}</span>
          </div>
          <h3 style={{ fontFamily: 'Lora, serif' }} className="font-bold text-ink-900 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors mb-1.5 text-[15px]">
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <CategoryBadge category={category} />
            <span className="text-[11px] text-ink-400 flex items-center gap-1"><Clock size={10} />{rt}</span>
          </div>
        </div>
        {cover_image && (
          <div className="w-[80px] h-[68px] rounded-xl overflow-hidden bg-ink-100 shrink-0">
            <img src={cover_image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
      </Link>
    )
  }

  return (
    <article className="group">
      <Link href={href} className="block">
        {cover_image ? (
          <div className="w-full h-[160px] rounded-xl overflow-hidden mb-3 bg-ink-100">
            <img src={cover_image} alt={title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400" />
          </div>
        ) : (
          <div className="w-full h-[160px] rounded-xl mb-3 bg-orange-50 flex items-center justify-center">
            <span className="text-[40px] opacity-30">✍️</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <AuthorAvatar author={author} size="xs" />
          <span className="text-[11px] text-ink-400 font-medium truncate">{author?.full_name || username}</span>
          <span className="text-[11px] text-ink-300 shrink-0">· {timeAgo(published_at)}</span>
        </div>
        <h3 style={{ fontFamily: 'Lora, serif' }} className="font-bold text-[#0a0a0a] leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors mb-2 text-[15.5px] tracking-tight">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <CategoryBadge category={category} />
          <div className="flex items-center gap-3 text-[11px] text-ink-400">
            <span className="flex items-center gap-1"><Clock size={10} />{rt}</span>
            {clap_count > 0 && <span className="flex items-center gap-1"><HandMetal size={10} />{clap_count}</span>}
            {comment_count > 0 && <span className="flex items-center gap-1"><MessageCircle size={10} />{comment_count}</span>}
          </div>
        </div>
      </Link>
    </article>
  )
}
