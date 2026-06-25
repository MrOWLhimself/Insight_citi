'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

export default function Settings() {
  const { user, profile, isAuthenticated, loading, refetchProfile } = useAuth()
  const router = useRouter()
  const [name, setName]     = useState('')
  const [bio, setBio]       = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (profile) { setName(profile.full_name || ''); setBio(profile.bio || ''); setAvatar(profile.avatar_url || '') }
  }, [profile])

  if (loading) return null
  if (!isAuthenticated) { router.push('/login'); return null }

  const uploadPhoto = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fname = 'avatar-' + user.id + '-' + Date.now() + '.' + file.name.split('.').pop()
      await supabase.storage.from('place-images').upload(fname, file, { contentType:file.type, upsert:true })
      const { data:{ publicUrl } } = supabase.storage.from('place-images').getPublicUrl(fname)
      await supabase.from('profiles').update({ avatar_url:publicUrl }).eq('id', user.id)
      setAvatar(publicUrl); refetchProfile?.(); toast.success('Photo updated!')
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await supabase.from('profiles').upsert({ id:user.id, full_name:name.trim(), bio:bio.trim() })
      refetchProfile?.(); toast.success('Settings saved!')
    } catch(err) { toast.error(err.message) }
    setSaving(false)
  }

  const inputStyle = { width:'100%', padding:'11px 14px', border:'1px solid var(--line)', borderRadius:14, fontSize:14, outline:'none', background:'#fff', marginTop:7, fontFamily:'var(--sans)' }

  return (
    <div style={{ maxWidth:560, margin:'40px auto', padding:'0 16px 80px' }}>
      <h1 style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:950, letterSpacing:'-.04em', marginBottom:24 }}>Profile Settings</h1>

      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:28 }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', background:'var(--soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'var(--orange)', border:'2px solid var(--line)' }}>
            {avatar ? <img src={avatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (name || 'W')[0].toUpperCase()}
          </div>
          <label style={{ position:'absolute', bottom:-2, right:-2, width:26, height:26, background:'var(--orange)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid #fff' }}>
            <Camera size={12} color="white" />
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={uploadPhoto} />
          </label>
        </div>
        <div>
          <p style={{ fontWeight:800, fontSize:16 }}>{name || 'Your Name'}</p>
          <p style={{ color:'var(--muted)', fontSize:13 }}>{user.email}</p>
        </div>
      </div>

      <form onSubmit={save}>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:900, color:'var(--muted)' }}>Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inputStyle} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:900, color:'var(--muted)' }}>Bio</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="A short bio for your writer profile..."
            style={{ ...inputStyle, height:'auto', padding:'11px 14px', resize:'none' }} />
        </div>
        <button type="submit" disabled={saving} style={{ padding:'11px 28px', background:'var(--ink)', color:'white', border:'none', borderRadius:14, fontWeight:900, fontSize:14, cursor:'pointer' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}