import { mockPieces } from '../data/mockPieces'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { BrandFilmstrip, type FilmstripItem } from '../components/BrandFilmstrip'
import { useLanguage } from '../i18n/LanguageContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Home.module.css'

const HERO_PIECE = mockPieces.find((p) => p.slug === 'cutout-flower-ring')!

const mazal = mockPieces.find((p) => p.slug === 'gemstone-dome-ring')!
const bracha = mockPieces.find((p) => p.slug === 'ribbed-earrings-wide-blue')!
const galya = mockPieces.find((p) => p.slug === 'green-stone-choker')!
const jeanine = mockPieces.find((p) => p.slug === 'cutout-flower-ring')!

// Pure atmosphere, not product listings — mixed sizes and a video for
// rhythm, pulled from across all four pieces' galleries (not just covers).
const FILMSTRIP_ITEMS: FilmstripItem[] = [
  { media: mazal.gallery[0], size: 'tall' },
  { media: bracha.gallery[3], size: 'square' },
  { media: galya.gallery[0], size: 'tall' },
  { media: jeanine.gallery[2], size: 'wide' },
  { media: mazal.gallery[2], size: 'square' },
  { media: bracha.gallery[1], size: 'tall' }, // video
  { media: galya.gallery[2], size: 'square' },
  { media: jeanine.gallery[0], size: 'tall' },
  { media: mazal.gallery[4], size: 'square' },
  { media: bracha.gallery[5], size: 'wide' },
]

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
      <BrandFilmstrip items={FILMSTRIP_ITEMS} />
    </main>
  )
}
