'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    setLoading(false)
    if (err) { setError(err.message); return }
    toast.success('Account created! Check your email.'); router.push('/login')
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
            Your story deserves<br />to be <span className="text-orange-500">heard.</span>
          </h1>
          <p className="text-ink-400 text-base leading-relaxed max-w-sm">Join writers from across Nigeria and Africa sharing news, culture, opinion and personal stories.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-ink-900 mb-1">Create account</h2>
          <p className="text-sm text-ink-400 mb-7">Join Insight. Free, always.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label:'Full name', value:fullName, set:setFullName, type:'text', ph:'Your name' },
              { label:'Email', value:email, set:setEmail, type:'email', ph:'you@example.com' },
              { label:'Password', value:password, set:setPassword, type:'password', ph:'Min 6 characters' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[11px] font-semibold text-ink-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required placeholder={f.ph}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors" />
              </div>
            ))}
            {error && <p className="text-[12px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Create account'}
            </button>
          </form>
          <p className="text-center text-[12px] text-ink-400 mt-6">
            Have an account? <Link href="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
