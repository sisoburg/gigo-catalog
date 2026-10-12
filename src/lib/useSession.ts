import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/** Public sign-ups are disabled project-wide, so any signed-in session here
 *  is the one admin account — no separate "is this user an admin" check. */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return { session, loading: session === undefined }
}
