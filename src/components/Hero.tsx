import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/strings'
import styles from './Hero.module.css'

interface HeroProps {
  imageSrc: string
  imageAlt: string
}

export function Hero({ imageSrc, imageAlt }: HeroProps) {
  const { locale } = useLanguage()
  return (
    <section className={styles.hero}>
      <img className={styles.image} src={imageSrc} alt={imageAlt} />
      <div className={styles.scrim} />
      <div className={styles.content}>
        <p className={styles.tagline}>{t('tagline', locale)}</p>
        <h1 className={styles.title}>{t('siteName', locale)}</h1>
      </div>
    </section>
  )
}
