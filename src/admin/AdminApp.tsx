import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../lib/useSession'
import { AdminLogin } from './AdminLogin'
import { AdminLayout } from './AdminLayout'
import { PieceList } from './PieceList'
import { PieceEdit } from './PieceEdit'
import { HeroSettings } from './HeroSettings'
import { WornSettings } from './WornSettings'
import './admin.css'

function RequireAuth() {
  const { session, loading } = useSession()
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
  return <Outlet />
}

export function AdminApp() {
  return (
    <div className="admin">
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<PieceList />} />
            <Route path="piece/new" element={<PieceEdit />} />
            <Route path="piece/:id" element={<PieceEdit />} />
            <Route path="hero" element={<HeroSettings />} />
            <Route path="worn" element={<WornSettings />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}
