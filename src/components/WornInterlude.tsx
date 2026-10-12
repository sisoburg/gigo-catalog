import { ScrambleHeading } from './ScrambleHeading'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './WornInterlude.module.css'

/** A short, text-only beat between the two WORN scroll moments — a palate
 *  cleanser that's purely typographic, so the section reads as more than
 *  one repeated image-scroll trick. */
export function WornInterlude() {
  const { locale } = useLanguage()
  return (
    <section className={styles.section}>
      <ScrambleHeading
        text={locale === 'he' ? 'כל תכשיט נושא סיפור משלו' : 'Every piece carries its own story'}
        className={styles.heading}
      />
    </section>
  )
}
