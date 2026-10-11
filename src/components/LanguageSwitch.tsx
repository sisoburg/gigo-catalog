import { useLanguage } from '../i18n/LanguageContext'
import styles from './LanguageSwitch.module.css'

export function LanguageSwitch() {
  const { locale, toggleLocale } = useLanguage()
  return (
    <button
      type="button"
      className={styles.switch}
      onClick={toggleLocale}
      aria-label={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
    >
      <span className={locale === 'he' ? styles.active : undefined}>עב</span>
      <span className={styles.sep}>/</span>
      <span className={locale === 'en' ? styles.active : undefined}>EN</span>
    </button>
  )
}
