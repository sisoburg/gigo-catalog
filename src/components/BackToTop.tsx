import { useEffect, useState } from 'react'
import { scrollToTop } from './SmoothScroll'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './BackToTop.module.css'

/** Appears once you've scrolled a screen or more down — mainly meant to
 *  rescue you from the pinned Worn filmstrip without a long manual scroll. */
export function BackToTop() {
  const { locale } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setVisible(window.scrollY > window.innerHeight * 0.9)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <button
      type="button"
      className={visible ? `${styles.button} ${styles.visible}` : styles.button}
      onClick={scrollToTop}
      aria-label={locale === 'he' ? 'חזרה למעלה' : 'Back to top'}
      tabIndex={visible ? 0 : -1}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
