import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BASE_PATH } from './basePath'
import { LanguageProvider } from './i18n/LanguageContext'
import { LanguageSwitch } from './components/LanguageSwitch'
import { FontPairingSwitcher } from './components/FontPairingSwitcher'
import { Home } from './pages/Home'
import { PieceDetail } from './pages/PieceDetail'
import styles from './App.module.css'

export function App() {
  return (
    <LanguageProvider>
      <BrowserRouter basename={BASE_PATH}>
        <header className={styles.header}>
          <LanguageSwitch />
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/piece/:slug" element={<PieceDetail />} />
        </Routes>
        <FontPairingSwitcher />
      </BrowserRouter>
    </LanguageProvider>
  )
}
