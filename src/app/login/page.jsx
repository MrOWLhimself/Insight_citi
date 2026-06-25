'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PenLine } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleEmail = async e => {
    e.preventDefault(); setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErr(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const handleGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://insight.citiplug.com/dashboard' }
  })

  const inputStyle = { width:'100%', padding:'11px 14px', border:'1px solid var(--line)', borderRadius:14, fontSize:14, outline:'none', fontFamily:'var(--sans)', background:'#fff', marginTop:7 }

  return (
    <div style={{ minHeight:'calc(100vh - 72px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper)', padding:16 }}>
      <div style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:28, padding:'40px 32px', width:'100%', maxWidth:420, boxShadow:'var(--shadow)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, background:'var(--ink)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 4px 16px rgba(34,34,34,.2)' }}>
            <PenLine size={24} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:950, letterSpacing:'-.04em', marginBottom:4 }}>Welcome back</h1>
          <p style={{ color:'var(--muted)', fontSize:13 }}>Sign in to Insight</p>
        </div>

        <button onClick={handleGoogle} style={{ width:'100%', padding:12, border:'1px solid var(--line)', borderRadius:14, background:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20 }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/></svg>
          Continue with Google
        </button>

        <form onSubmit={handleEmail}>
          {err && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13, padding:'10px 14px', borderRadius:12, marginBottom:14, border:'1px solid #fecaca' }}>{err}</div>}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:900, color:'var(--muted)' }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required style={inputStyle} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:900, color:'var(--muted)' }}>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:'var(--ink)', color:'white', border:'none', borderRadius:14, fontWeight:900, fontSize:15, cursor:'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--muted)' }}>
          No account? <Link href="/register" style={{ color:'var(--orange)', fontWeight:800, textDecoration:'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}