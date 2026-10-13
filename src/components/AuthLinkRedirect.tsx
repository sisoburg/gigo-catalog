import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumeAuthIntent, supabase } from '../lib/supabase'

/** Sends someone who arrived via an invite / password-reset email to the
 *  set-password page once supabase-js has signed them in from the link. */
export function AuthLinkRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const go = () => navigate('/admin/set-password', { replace: true })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        consumeAuthIntent()
        go()
      } else if (session && consumeAuthIntent()) {
        go()
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [navigate])

  return null
}
