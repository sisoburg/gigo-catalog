import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill them in.')
}

// Invite and password-reset emails land here with the tokens in the URL
// hash (#access_token=…&type=invite). supabase-js signs the visitor in and then
// wipes the hash, so remember what kind of link it was first — the app uses
// this to send them to the "set your password" page.
const AUTH_INTENT_KEY = 'gigo-auth-intent'
try {
  const type = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type')
  if (type === 'invite' || type === 'recovery') sessionStorage.setItem(AUTH_INTENT_KEY, type)
} catch {
  /* storage unavailable — the link still signs them in, they just land on the home page */
}

export function consumeAuthIntent(): string | null {
  try {
    const intent = sessionStorage.getItem(AUTH_INTENT_KEY)
    if (intent) sessionStorage.removeItem(AUTH_INTENT_KEY)
    return intent
  } catch {
    return null
  }
}

// Public anon key only — safe to ship to the client. RLS (see the
// initial_schema migration) is what actually keeps drafts and writes
// restricted, not this key being secret.
export const supabase = createClient<Database>(url, anonKey)
