import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return undefined
    }

    let active = true
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setSession(data.session)
      await loadAccess(data.session?.user?.id)
      if (active) setLoading(false)
    }

    const loadAccess = async (userId) => {
      if (!userId) {
        setProfile(null)
        setRole(null)
        return
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (!active) return
      setProfile(profileData || { id: userId, full_name: '' })
      setRole(profileData?.active ? profileData.role : null)
    }

    loadSession()
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      await loadAccess(nextSession?.user?.id)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    role,
    loading,
    async signIn(email, password) {
      if (!supabase) return { error: new Error('Supabase is not configured.') }
      return supabase.auth.signInWithPassword({ email, password })
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
    },
    canAccess(roles) {
      return !roles?.length || roles.includes(role)
    }
  }), [session, profile, role, loading])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return context
}
