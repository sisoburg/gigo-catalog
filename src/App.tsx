import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BASE_PATH } from './basePath'
import { SmoothScroll } from './components/SmoothScroll'
import { PublicApp } from './PublicApp'
import { AdminApp } from './admin/AdminApp'

export function App() {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <SmoothScroll />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<PublicApp />} />
      </Routes>
    </BrowserRouter>
  )
}
