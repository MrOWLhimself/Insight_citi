// Insight analytics tracker
const PLATFORM = 'insight'
const SESSION_KEY = 'ins_session'

function getOrCreateSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) return JSON.parse(stored)
    const session = {
      id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      startedAt: Date.now(),
      pageCount: 0,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  } catch { return { id: `ins_anon_${Date.now()}`, startedAt: Date.now(), pageCount: 0 } }
}

function updateSession(updates) {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const session = { ...JSON.parse(stored), ...updates }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
  } catch {}
}

function parseSource(referrer) {
  if (!referrer) return { source: 'direct', medium: 'direct' }
  const url = referrer.toLowerCase()
  if (url.includes('google')) return { source: 'google', medium: 'organic' }
  if (url.includes('facebook') || url.includes('fb.com')) return { source: 'facebook', medium: 'social' }
  if (url.includes('twitter') || url.includes('x.com')) return { source: 'twitter', medium: 'social' }
  if (url.includes('whatsapp')) return { source: 'whatsapp', medium: 'social' }
  return { source: new URL(referrer).hostname, medium: 'referral' }
}

function getDevice() {
  const ua = navigator.userAgent.toLowerCase()
  if (/tablet|ipad/.test(ua)) return 'tablet'
  if (/mobile|android|iphone/.test(ua)) return 'mobile'
  return 'desktop'
}

export async function trackPageview(page, pageTitle) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const session = getOrCreateSession()
    const { source, medium } = parseSource(document.referrer)
    const isNew = session.pageCount === 0
    updateSession({ pageCount: session.pageCount + 1 })
    if (isNew) {
      await sb.from('analytics_sessions').upsert({
        id: session.id, platform: PLATFORM,
        started_at: new Date(session.startedAt).toISOString(),
        page_count: 1, device: getDevice(),
        referrer: document.referrer || null, source, medium, is_bounce: true,
      }, { onConflict: 'id' })
    } else {
      await sb.from('analytics_sessions').update({ page_count: session.pageCount + 1, is_bounce: false }).eq('id', session.id)
    }
    await sb.from('analytics_pageviews').insert({
      platform: PLATFORM, page, page_title: pageTitle || document.title,
      session_id: session.id, referrer: document.referrer || null,
      source, medium, device: getDevice(),
    })
  } catch {}
}

export async function trackEvent(eventName, eventValue) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const session = getOrCreateSession()
    await sb.from('analytics_events').insert({
      platform: PLATFORM, event_name: eventName,
      event_value: String(eventValue || ''), session_id: session.id,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
    })
  } catch {}
}
