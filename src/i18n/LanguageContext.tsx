import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../data/types'

const STORAGE_KEY = 'gigo-locale'

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'he' || stored === 'en') return stored
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to browser language.
  }
  return navigator.language?.toLowerCase().startsWith('he') ? 'he' : 'en'
}

interface LanguageContextValue {
  locale: Locale
  dir: 'rtl' | 'ltr'
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)
  const dir = locale === 'he' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Ignore write failures; language choice just won't persist this session.
    }
  }, [locale, dir])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dir,
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((l) => (l === 'he' ? 'en' : 'he')),
    }),
    [locale, dir],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
