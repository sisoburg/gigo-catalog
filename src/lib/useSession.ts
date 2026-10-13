import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Signed-in session, plus whether that user is on the admin allowlist
 *  (public.admin_users). Being signed in is NOT enough to be an admin: the
 *  database policies enforce the same allowlist, this check just keeps the
 *  admin UI from rendering for anyone else. */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined) // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (session === undefined) return
    if (!userId) {
      setIsAdmin(false)
      return
    }
    let cancelled = false
    setIsAdmin(undefined)
    supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) setIsAdmin(!error && !!data)
      })
    return () => {
      cancelled = true
    }
  }, [session, userId])

  return { session, isAdmin, loading: session === undefined || isAdmin === undefined }
}
