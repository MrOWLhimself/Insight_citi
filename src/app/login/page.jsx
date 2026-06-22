'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    toast.success('Welcome back!'); router.push('/')
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://insight.citiplug.com/auth/callback' } })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-ink-900 flex-col p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Lora, serif' }} className="font-bold text-white text-lg">Insight</span>
        </div>
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl font-bold text-white leading-tight mb-4">
            Write. Read.<br /><span className="text-orange-500">Be heard.</span>
          </h1>
          <p className="text-ink-400 text-base leading-relaxed max-w-sm">Nigeria's open publishing platform. Stories that matter, from writers who live it.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-ink-900 mb-1">Welcome back</h2>
          <p className="text-sm text-ink-400 mb-7">Sign in to your account</p>
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-3 border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors mb-5">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-ink-100"/><span className="text-[11px] text-ink-400">or</span><div className="flex-1 h-px bg-ink-100"/></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-ink-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full px-4 py-3 border border-ink-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-600 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full px-4 py-3 border border-ink-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors" />
            </div>
            {error && <p className="text-[12px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-[12px] text-ink-400 mt-6">
            No account? <Link href="/register" className="text-orange-500 font-semibold hover:underline">Start writing free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
