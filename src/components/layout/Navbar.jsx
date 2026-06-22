'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Search, PenLine, Menu, X, LogOut, User, LayoutDashboard, Settings, ChevronDown } from 'lucide-react'

const NAV_CATS = [
  { label: 'News', slug: 'news' },
  { label: 'Culture', slug: 'culture' },
  { label: 'Lifestyle', slug: 'lifestyle' },
  { label: 'Opinion', slug: 'opinion' },
  { label: 'Tech', slug: 'tech' },
  { label: 'Sports', slug: 'sports' },
]

function UserDropdown({ user, profile, logout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const username = profile?.username || user?.email?.split('@')[0] || ''
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <ChevronDown size={13} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{profile?.full_name || username}</p>
            <p className="text-[11px] text-gray-400 truncate">@{username}</p>
          </div>
          {[
            { label: 'My profile', icon: User, href: `/u/${username}` },
            { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
            { label: 'Settings', icon: Settings, href: '/settings' },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
              <item.icon size={14} className="text-gray-400" />
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const { user, profile, isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const username = profile?.username || user?.email?.split('@')[0] || ''

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[52px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-[28px] h-[28px] bg-gray-900 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div className="flex items-baseline gap-1">
            <span style={{ fontFamily: 'Lora, serif' }} className="font-bold text-[16px] text-gray-900">Insight</span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">by CitiPlug</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_CATS.map(cat => (
            <Link key={cat.slug} href={`/topic/${cat.slug}`}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                pathname === `/topic/${cat.slug}` ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/search"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 transition-colors">
            <Search size={16} />
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/write"
                className="hidden sm:flex items-center gap-1.5 px-4 py-[7px] bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[12px] font-semibold transition-colors">
                <PenLine size={13} /> Write
              </Link>
              <UserDropdown user={user} profile={profile} logout={logout} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-[12px] text-gray-500 hover:text-gray-900 font-medium hidden sm:block transition-colors">Sign in</Link>
              <Link href="/register"
                className="px-4 py-[7px] bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[12px] font-semibold transition-colors">
                Get started
              </Link>
            </>
          )}

          <button className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3">
          <div className="space-y-1 mb-3">
            {NAV_CATS.map(cat => (
              <Link key={cat.slug} href={`/topic/${cat.slug}`} onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-3 rounded-xl text-[13px] text-gray-600 hover:bg-gray-50 hover:text-orange-500 font-medium transition-colors">
                {cat.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {isAuthenticated ? (
              <>
                <Link href="/write" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-3 text-[13px] text-orange-500 font-semibold">
                  <PenLine size={14} /> Write a story
                </Link>
                <Link href={`/u/${username}`} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-3 text-[13px] text-gray-600 hover:bg-gray-50 rounded-xl">
                  <User size={14} /> My profile
                </Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-3 text-[13px] text-gray-600 hover:bg-gray-50 rounded-xl">
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <button onClick={() => { logout(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 py-2.5 px-3 text-[13px] text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 text-center text-[13px] font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 text-center text-[13px] font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
