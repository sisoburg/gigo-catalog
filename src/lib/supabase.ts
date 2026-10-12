import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill them in.')
}

// Public anon key only — safe to ship to the client. RLS (see the
// initial_schema migration) is what actually keeps drafts and writes
// restricted, not this key being secret.
export const supabase = createClient<Database>(url, anonKey)
