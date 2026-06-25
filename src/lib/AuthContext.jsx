'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sb, setSb]           = useState(null)

  useEffect(() => {
    import('./supabase').then(({ supabase }) => setSb(supabase))
  }, [])

  useEffect(() => {
    if (!sb) return
    let sub = null
    const init = async () => {
      try {
        const { data: { session } } = await sb.auth.getSession()
        if (session?.user) { setUser(session.user); fetchProfile(session.user.id) }
      } catch {}
      setLoading(false)
      try {
        const { data } = sb.auth.onAuthStateChange((_e, session) => {
          setUser(session?.user ?? null)
          if (session?.user) fetchProfile(session.user.id)
          else setProfile(null)
          setLoading(false)
        })
        sub = data.subscription
      } catch {}
    }
    init()
    return () => { try { sub?.unsubscribe() } catch {} }
  }, [sb])

  const fetchProfile = async (uid) => {
    if (!sb) return
    try {
      const { data } = await sb.from('profiles').select('id,full_name,avatar_url,bio,role').eq('id', uid).single()
      if (data) setProfile(data)
    } catch {}
  }

  const logout = async () => {
    try { if (sb) await sb.auth.signOut() } catch {}
    setUser(null); setProfile(null)
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  return (
    <Ctx.Provider value={{
      user, profile, loading,
      isAuthenticated: !!user,
      logout,
      refetchProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)