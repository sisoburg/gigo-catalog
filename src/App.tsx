import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BASE_PATH } from './basePath'
import { SmoothScroll } from './components/SmoothScroll'
import { PublicApp } from './PublicApp'

// Code-split: the admin bundle (react-easy-crop, all admin UI/logic) would
// otherwise ship to every public visitor even though they never see it.
const AdminApp = lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })))

export function App() {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <SmoothScroll />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route path="/*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  )
}
