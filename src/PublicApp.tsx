import { Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { CatalogProvider } from './data/CatalogContext'
import { LanguageSwitch } from './components/LanguageSwitch'
import { InstagramLink } from './components/InstagramLink'
import { BackToTop } from './components/BackToTop'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { PieceDetail } from './pages/PieceDetail'
import styles from './App.module.css'

export function PublicApp() {
  return (
    <LanguageProvider>
      <CatalogProvider>
        <header className={styles.header}>
          <InstagramLink />
          <LanguageSwitch />
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/piece/:slug" element={<PieceDetail />} />
        </Routes>
        <Footer />
        <BackToTop />
      </CatalogProvider>
    </LanguageProvider>
  )
}
