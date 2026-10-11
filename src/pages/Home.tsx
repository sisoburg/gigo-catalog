import { mockPieces } from '../data/mockPieces'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { useLanguage } from '../i18n/LanguageContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Home.module.css'

const HERO_PIECE = mockPieces.find((p) => p.slug === 'cutout-flower-ring')!

export function Home() {
  const { locale } = useLanguage()
  const headingRef = useScrollReveal<HTMLDivElement>()

  return (
    <main>
      <Hero imageSrc={HERO_PIECE.cover.src} imageAlt={HERO_PIECE.cover.alt[locale]} />
      <section className={styles.collection}>
        <div ref={headingRef} className={styles.heading}>
          <h2>{locale === 'he' ? 'האוסף' : 'The Collection'}</h2>
        </div>
        <Carousel pieces={mockPieces} />
      </section>
    </main>
  )
}
