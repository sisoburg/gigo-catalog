import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { trackPageView } from '../lib/analytics'

/** Logs one anonymous page view per route change. Renders nothing. */
export function PageViewTracker() {
  const { pathname } = useLocation()
  const { locale } = useLanguage()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    // Guards StrictMode's double effect run and language-only re-renders.
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    void trackPageView(pathname, locale)
  }, [pathname, locale])

  return null
}
