import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BASE_PATH } from '../basePath'

export function AdminLayout() {
  return (
    <>
      <div className="adminTopbar">
        <h1>Gigo Admin</h1>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Pieces
          </NavLink>
          <NavLink to="/admin/hero" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Hero
          </NavLink>
          <NavLink to="/admin/worn" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Worn
          </NavLink>
          <a href={BASE_PATH} target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            style={{ background: 'none', border: 'none', color: 'var(--a-muted)', cursor: 'pointer', font: 'inherit', padding: 0 }}
          >
            Log out
          </button>
        </nav>
      </div>
      <div className="adminMain wide">
        <Outlet />
      </div>
    </>
  )
}
