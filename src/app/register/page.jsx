'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PenLine } from 'lucide-react'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setErr('')
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName } }
    })
    if (error) { setErr(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const inputStyle = { width:'100%', padding:'11px 14px', border:'1px solid var(--line)', borderRadius:14, fontSize:14, outline:'none', background:'#fff', marginTop:7 }

  return (
    <div style={{ minHeight:'calc(100vh - 72px)', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--paper)', padding:16 }}>
      <div style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:28, padding:'40px 32px', width:'100%', maxWidth:420, boxShadow:'var(--shadow)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, background:'var(--ink)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}><PenLine size={24} color="#fff" /></div>
          <h1 style={{ fontFamily:'var(--display)', fontSize:22, fontWeight:950, letterSpacing:'-.04em', marginBottom:4 }}>Join Insight</h1>
          <p style={{ color:'var(--muted)', fontSize:13 }}>Start writing for Insight by CitiPlug</p>
        </div>
        <form onSubmit={handleSubmit}>
          {err && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13, padding:'10px 14px', borderRadius:12, marginBottom:14 }}>{err}</div>}
          {[['Full Name','text','Your name','fullName'],['Email','email','you@example.com','email'],['Password','password','Min 6 characters','password']].map(([label,type,ph,key]) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:900, color:'var(--muted)' }}>{label}</label>
              <input value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} type={type} placeholder={ph} required minLength={key==='password'?6:undefined} style={inputStyle} />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background:'var(--ink)', color:'white', border:'none', borderRadius:14, fontWeight:900, fontSize:15, cursor:'pointer', marginTop:6 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--muted)' }}>
          Have an account? <Link href="/login" style={{ color:'var(--orange)', fontWeight:800, textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}