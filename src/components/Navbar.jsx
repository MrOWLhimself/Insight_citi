'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { PenLine, User, LogOut, Settings, LayoutDashboard, Search, Menu, X } from 'lucide-react'

const LINKS = [
  ['/topic/news','News'],['/topic/features','Features'],['/topic/stories','Stories'],
  ['/topic/business','Business'],['/topic/culture','Culture'],
  ['/topic/nigeria','Nigeria'],['/topic/africa','Africa'],['/topic/sports','Sport'],
]

const itemStyle = {
  display:'flex', alignItems:'center', gap:10, padding:'11px 12px',
  borderRadius:12, textDecoration:'none', color:'var(--ink)',
  fontSize:13, fontWeight:750, textAlign:'left', width:'100%', border:0, background:'transparent', cursor:'pointer'
}

export default function Navbar() {
  const { profile, isAuthenticated, logout } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav style={{ borderBottom:'1px solid var(--line)', background:'rgba(255,253,248,.92)', backdropFilter:'blur(18px)', position:'sticky', top:0, zIndex:50 }}>
      <div className="container" style={{ height:72, display:'flex', alignItems:'center', gap:20 }}>
        {/* Logo */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'var(--ink)', flexShrink:0 }}>
          <span style={{ width:40, height:40, borderRadius:14, background:'var(--ink)', display:'grid', placeItems:'center', boxShadow:'0 10px 30px rgba(16,16,16,.16)' }}>
            <PenLine size={18} color="#fff" />
          </span>
          <span>
            <strong style={{ display:'block', fontFamily:'var(--display)', fontSize:22, letterSpacing:'-.06em' }}>Insight</strong>
            <em style={{ display:'block', fontSize:10, fontStyle:'normal', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--orange)', fontWeight:900, marginTop:-3 }}>by CitiPlug</em>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="mobile-hide" style={{ display:'flex', gap:0, alignItems:'center', flex:1 }}>
          {LINKS.map(([href, label]) => (
            <Link key={href} className="nav-link" href={href}>{label}</Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <Link className="mobile-hide" href="/search" style={{ width:38, height:38, borderRadius:'50%', border:'1px solid var(--line)', display:'grid', placeItems:'center', color:'var(--ink)', textDecoration:'none' }}>
            <Search size={16} />
          </Link>
          {isAuthenticated && (
            <Link href="/write" className="btn btn-dark" style={{ fontSize:13 }}>
              <PenLine size={14} /> Write
            </Link>
          )}
          {isAuthenticated ? (
            <div style={{ position:'relative' }}>
              <button onClick={() => setUserOpen(o => !o)} style={{ width:40, height:40, borderRadius:'50%', border:'1px solid var(--line)', background:'#fff', display:'grid', placeItems:'center', overflow:'hidden', cursor:'pointer' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <User size={17} />}
              </button>
              {userOpen && (
                <div onClick={() => setUserOpen(false)} style={{ position:'absolute', right:0, top:'calc(100% + 12px)', minWidth:220, background:'#fff', border:'1px solid var(--line)', borderRadius:18, boxShadow:'var(--shadow)', padding:8, zIndex:100 }}>
                  <Link href="/dashboard" style={itemStyle}><LayoutDashboard size={15} /> Contributor Dashboard</Link>
                  <Link href="/settings" style={itemStyle}><Settings size={15} /> Settings</Link>
                  <button onClick={logout} style={{ ...itemStyle, color:'#b42318' }}><LogOut size={15} /> Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn btn-soft" style={{ fontSize:13 }}>Sign In</Link>
          )}
          <button onClick={() => setMobileOpen(o => !o)} className="mobile-only" style={{ width:38, height:38, borderRadius:'50%', border:'1px solid var(--line)', background:'#fff', display:'none', placeItems:'center', cursor:'pointer' }}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="container" style={{ padding:'8px 0 16px', display:'grid', gap:4 }}>
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ padding:'12px 4px', textDecoration:'none', color:'var(--ink)', fontWeight:800, borderBottom:'1px solid var(--line)', fontSize:15 }}>
              {label}
            </Link>
          ))}
          {!isAuthenticated && <Link href="/login" onClick={() => setMobileOpen(false)} className="btn btn-dark" style={{ marginTop:8, justifyContent:'center' }}>Sign In</Link>}
          {isAuthenticated && <Link href="/write" onClick={() => setMobileOpen(false)} className="btn btn-dark" style={{ marginTop:8, justifyContent:'center' }}><PenLine size={14} /> Write</Link>}
        </div>
      )}

      <style>{`
        @media(max-width:900px) { .mobile-hide{display:none!important} .mobile-only{display:grid!important} }
      `}</style>
    </nav>
  )
}