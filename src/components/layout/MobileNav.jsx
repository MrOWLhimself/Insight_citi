'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Home, Search, PenLine, BookOpen, User } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated, profile, user } = useAuth()
  const username = profile?.username || user?.email?.split('@')[0] || ''

  const active = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  const LEFT_TABS = [
    { label: 'Home',   path: '/',        icon: Home },
    { label: 'Search', path: '/search',  icon: Search },
  ]

  const RIGHT_TABS = [
    { label: 'Topics', path: '/topic/news', icon: BookOpen },
    {
      label: isAuthenticated ? 'Me' : 'Sign in',
      path: isAuthenticated ? `/u/${username}` : '/login',
      icon: User,
    },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 border-t"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: '#f3f4f6',
        }}
      />

      <div className="relative flex items-center justify-around px-2 h-16">

        {/* Left tabs */}
        {LEFT_TABS.map(({ label, path, icon: Icon }) => {
          const isActive = active(path)
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 py-1 select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className="w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
                style={{ background: isActive ? '#fff7ed' : 'transparent' }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isActive ? '#f97316' : '#9ca3af',
                    strokeWidth: isActive ? 2.5 : 1.8,
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{ color: isActive ? '#f97316' : '#9ca3af' }}
              >
                {label}
              </span>
            </Link>
          )
        })}

        {/* Centre — Write button */}
        <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
          <Link
            href="/write"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="flex flex-col items-center gap-0.5"
          >
            {/* Glow ring */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute w-14 h-14 rounded-full opacity-20"
                style={{ background: '#f97316' }}
              />
              <div
                className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 4px 20px rgba(249,115,22,0.45)',
                }}
              >
                <PenLine size={20} color="white" strokeWidth={2.2} />
              </div>
            </div>
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: '#f97316' }}
            >
              Write
            </span>
          </Link>
        </div>

        {/* Right tabs */}
        {RIGHT_TABS.map(({ label, path, icon: Icon }) => {
          const isActive = active(path)
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 py-1 select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div
                className="w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
                style={{ background: isActive ? '#fff7ed' : 'transparent' }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isActive ? '#f97316' : '#9ca3af',
                    strokeWidth: isActive ? 2.5 : 1.8,
                    transition: 'all 0.2s',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{ color: isActive ? '#f97316' : '#9ca3af' }}
              >
                {label}
              </span>
            </Link>
          )
        })}

      </div>
    </nav>
  )
}
