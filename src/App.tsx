import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BASE_PATH } from './basePath'
import { LanguageProvider } from './i18n/LanguageContext'
import { LanguageSwitch } from './components/LanguageSwitch'
import { InstagramLink } from './components/InstagramLink'
import { SmoothScroll } from './components/SmoothScroll'
import { BackToTop } from './components/BackToTop'
import { Home } from './pages/Home'
import { PieceDetail } from './pages/PieceDetail'
import styles from './App.module.css'

export function App() {
  return (
    <LanguageProvider>
      <BrowserRouter basename={BASE_PATH}>
        <SmoothScroll />
        <header className={styles.header}>
          <InstagramLink />
          <LanguageSwitch />
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/piece/:slug" element={<PieceDetail />} />
        </Routes>
        <BackToTop />
      </BrowserRouter>
    </LanguageProvider>
  )
}
