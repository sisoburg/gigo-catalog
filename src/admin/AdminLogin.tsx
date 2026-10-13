import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'

export function AdminLogin() {
  const { session, isAdmin, loading: sessionLoading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only admins are sent on to /admin; a signed-in non-admin lands there too
  // and gets the "no admin access" screen with a sign-out button.
  if (!sessionLoading && session && isAdmin !== undefined) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) setError(error.message)
  }

  return (
    <div className="adminMain" style={{ maxWidth: 360, paddingTop: '15vh' }}>
      <h1 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Gigo Admin</h1>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? <span className="spinner" /> : 'Log in'}
        </button>
      </form>
    </div>
  )
}
