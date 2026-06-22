import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase'
import { MapPin, Calendar, Star, ArrowRight, Ticket } from 'lucide-react'

const CITIPLUG_URL = 'https://citiplug.com'

async function getFeaturedPlaces() {
  const sb = createServerSupabase()
  const { data } = await sb.from('places')
    .select('id, name, category, area, cover_image, rating_average, is_verified, plan')
    .eq('status', 'published')
    .in('plan', ['pro', 'basic'])
    .order('rating_average', { ascending: false })
    .limit(4)
  return data || []
}

async function getUpcomingEvents() {
  const sb = createServerSupabase()
  const { data } = await sb.from('events')
    .select('id, title, venue, start_date, ticket_price, is_free, ticketpass_url, image_url')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(3)
  return data || []
}

export default async function CitiplugSidebar() {
  const [places, events] = await Promise.all([getFeaturedPlaces(), getUpcomingEvents()])

  if (!places.length && !events.length) return null

  return (
    <aside className="space-y-6">
      {/* Featured Places */}
      {places.length > 0 && (
        <div className="border border-ink-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'Lora, serif' }} className="font-semibold text-[13px] text-gray-900">Featured on CitiPlug</span>
            </div>
            <a href={CITIPLUG_URL} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-orange-500 font-semibold hover:underline">
              Explore →
            </a>
          </div>
          <div className="divide-y divide-ink-50">
            {places.map(place => (
              <a key={place.id} href={`${CITIPLUG_URL}/place/${place.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {place.cover_image
                    ? <img src={place.cover_image} alt={place.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-base">📍</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 group-hover:text-orange-500 transition-colors truncate">{place.name}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="capitalize">{place.category?.replace('_', ' ')}</span>
                    {place.area && <><span>·</span><span>{place.area}</span></>}
                    {place.rating_average > 0 && <><span>·</span><span className="text-amber-500">⭐ {place.rating_average.toFixed(1)}</span></>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <div className="border border-ink-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-orange-500" />
              <span style={{ fontFamily: 'Lora, serif' }} className="font-semibold text-[13px] text-gray-900">Upcoming Events</span>
            </div>
            <a href={`${CITIPLUG_URL}/events`} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-orange-500 font-semibold hover:underline">
              See all →
            </a>
          </div>
          <div className="divide-y divide-ink-50">
            {events.map(event => {
              const date = event.start_date ? new Date(event.start_date).toLocaleDateString('en-NG', { weekday:'short', day:'numeric', month:'short' }) : ''
              return (
                <a key={event.id} href={`${CITIPLUG_URL}/events`} target="_blank" rel="noopener noreferrer"
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <p className="text-[13px] font-semibold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-1">{event.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-gray-400">{date} · {event.venue}</p>
                    {event.ticketpass_url ? (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        TicketPass
                      </span>
                    ) : event.is_free || !event.ticket_price ? (
                      <span className="text-[10px] font-bold text-green-600">Free</span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-600">₦{Number(event.ticket_price).toLocaleString()}</span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-center">
        <p style={{ fontFamily: 'Lora, serif' }} className="font-bold text-white text-[14px] mb-1">Discover Ijebu Ode</p>
        <p className="text-white/80 text-[11px] mb-3">Places, events, hotels & restaurants</p>
        <a href={CITIPLUG_URL} target="_blank" rel="noopener noreferrer"
          className="inline-block w-full py-2 bg-white text-orange-600 rounded-xl text-[12px] font-bold hover:bg-orange-50 transition-colors">
          Open CitiPlug ⚡
        </a>
      </div>
    </aside>
  )
}
