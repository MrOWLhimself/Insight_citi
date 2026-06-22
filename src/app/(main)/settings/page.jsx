'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, isAuthenticated, isLoadingAuth, refetchProfile } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) router.push('/login')
  }, [isAuthenticated, isLoadingAuth])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setUsername(profile.username || user?.email?.split('@')[0] || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile, user])

  const uploadAvatar = async (file) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return }
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const name = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('insight-images').upload(name, file, { contentType: file.type, upsert: true })
    if (error) { toast.error('Upload failed'); setUploadingAvatar(false); return }
    const { data: { publicUrl } } = supabase.storage.from('insight-images').getPublicUrl(name)
    setAvatarUrl(publicUrl); setUploadingAvatar(false); toast.success('Avatar updated')
  }

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName,
      username: username.toLowerCase().replace(/\s+/g,''),
      bio, avatar_url: avatarUrl, updated_at: new Date().toISOString()
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile saved!')
    refetchProfile?.()
  }

  if (!isAuthenticated && !isLoadingAuth) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-ink-900 mb-8">Settings</h1>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : (fullName || 'U')[0].toUpperCase()}
          </div>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Change photo
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => uploadAvatar(e.target.files?.[0])} />
          </label>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          {[
            { label:'Full name', value:fullName, set:setFullName, ph:'Your full name' },
            { label:'Username', value:username, set:setUsername, ph:'yourname', prefix:'@' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
              <div className="relative">
                {f.prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{f.prefix}</span>}
                <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className={`w-full border border-gray-200 rounded-xl py-3 text-sm outline-none focus:border-orange-400 transition-colors ${f.prefix ? 'pl-8 pr-4' : 'px-4'}`} />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell readers about yourself…"
              rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
// logout is available via useAuth - already handled in Navbar dropdown
