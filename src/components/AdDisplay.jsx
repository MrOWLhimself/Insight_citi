'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const SIZE_STYLES = {
  '1200x200': { width: '100%', height: 200 },
  '728x90':   { width: '100%', height: 90, maxWidth: 728 },
  '300x600':  { width: 300, height: 600 },
  '300x250':  { width: '100%', height: 250, maxWidth: 300 },
  '320x50':   { width: '100%', height: 50, maxWidth: 320 },
}

export default function AdDisplay({ slotId, className = '' }) {
  const [ad, setAd] = useState(null)
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    if (!slotId) return
    supabase.from('ad_campaigns')
      .select('id, image_url, destination_url, alt_text, size')
      .eq('slot', slotId).eq('status', 'active')
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('priority', { ascending: false }).limit(3)
      .then(({ data }) => {
        if (data?.length) {
          const pool = data.slice(0, 3)
          setAd(pool[Math.floor(Math.random() * pool.length)])
        }
      })
  }, [slotId])

  useEffect(() => {
    if (!ad || tracked) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        supabase.from('ad_campaigns').update({ impression_count: ad.impression_count + 1 }).eq('id', ad.id)
        setTracked(true)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    const el = document.getElementById(`ins-ad-${ad.id}`)
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [ad, tracked])

  if (!ad) return null
  const s = SIZE_STYLES[ad.size] || { width: '100%', height: 90 }

  return (
    <div className={`flex flex-col items-center my-4 ${className}`}>
      <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Sponsored</p>
      <a id={`ins-ad-${ad.id}`} href={ad.destination_url} target="_blank" rel="noopener noreferrer sponsored"
        onClick={() => supabase.from('ad_campaigns').update({ click_count: ad.click_count + 1 }).eq('id', ad.id)}
        className="block overflow-hidden rounded-xl hover:opacity-90 transition-opacity" style={s}>
        <img src={ad.image_url} alt={ad.alt_text || 'Advertisement'} className="w-full h-full object-cover" loading="lazy" />
      </a>
    </div>
  )
}
