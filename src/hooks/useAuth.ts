import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { configured, supabase } from '@/lib'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) return
    let active = true
    let authVersion = 0

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return
      authVersion += 1
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const initialVersion = authVersion
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active || authVersion !== initialVersion) return
      setUser(error ? null : data.user)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  return { user, loading, signIn, signOut }
}
