import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../lib/useSession'
import { supabase } from '../lib/supabase'
import { AdminLogin } from './AdminLogin'
import { SetPassword } from './SetPassword'
import { AdminLayout } from './AdminLayout'
import { PieceList } from './PieceList'
import { PieceEdit } from './PieceEdit'
import { HeroSettings } from './HeroSettings'
import { WornSettings } from './WornSettings'
import { Analytics } from './Analytics'
import './admin.css'

function RequireAuth() {
  const { session, isAdmin, loading } = useSession()
  if (loading) {
    return (
      <div className="admin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh' }}>
        <span className="spinner" />
      </div>
    )
  }
  // Absolute path — "login" alone resolves relative to the matched route
  // (e.g. /admin/piece/:id/login) since this renders from a nested route.
  if (!session) return <Navigate to="/admin/login" replace />
  // Signed in but not on the admin allowlist (e.g. a self-registered account):
  // show nothing of the admin UI. The database refuses their writes as well.
  if (!isAdmin) {
    return (
      <div className="adminMain" style={{ maxWidth: 360, paddingTop: '15vh' }}>
        <h1 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>No admin access</h1>
        <p className="helpText">This account isn't an admin of this site.</p>
        <button className="btn" type="button" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    )
  }
  return <Outlet />
}

export function AdminApp() {
  return (
    <div className="admin">
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route path="set-password" element={<SetPassword />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<PieceList />} />
            <Route path="piece/new" element={<PieceEdit />} />
            <Route path="piece/:id" element={<PieceEdit />} />
            <Route path="hero" element={<HeroSettings />} />
            <Route path="worn" element={<WornSettings />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}
