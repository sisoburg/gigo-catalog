import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'

const MIN_LENGTH = 8

/** Where invite / password-reset emails end up: choose a password so the
 *  account can log in normally next time. Needs the session the email link
 *  just created, but not (yet) admin status. */
export function SetPassword() {
  const navigate = useNavigate()
  const { session, loading } = useSession()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`)
    if (password !== confirm) return setError("The two passwords don't match.")
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) setError(error.message)
    else navigate('/admin', { replace: true })
  }

  if (loading) {
    return (
      <div className="adminMain" style={{ maxWidth: 360, paddingTop: '15vh' }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="adminMain" style={{ maxWidth: 360, paddingTop: '15vh' }}>
        <h1 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Link expired</h1>
        <p className="helpText">This invite or reset link is no longer valid. Ask for a new one, or log in if you already have a password.</p>
        <Link className="btn" to="/admin/login" style={{ color: '#fff' }}>
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="adminMain" style={{ maxWidth: 360, paddingTop: '15vh' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Set your password</h1>
      <p className="helpText">{session.user.email}</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            required
            minLength={MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? <span className="spinner" /> : 'Save password'}
        </button>
      </form>
    </div>
  )
}
