import { mockPieces } from '../data/mockPieces'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { WornGallery } from '../components/WornGallery'
import { useLanguage } from '../i18n/LanguageContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Home.module.css'

const HERO_PIECE = mockPieces.find((p) => p.slug === 'cutout-flower-ring')!

const mazal = mockPieces.find((p) => p.slug === 'gemstone-dome-ring')!
const bracha = mockPieces.find((p) => p.slug === 'ribbed-earrings-wide-blue')!
const galya = mockPieces.find((p) => p.slug === 'green-stone-choker')!
const jeanine = mockPieces.find((p) => p.slug === 'cutout-flower-ring')!

// Secondary on-body shots (not the covers already shown in the carousel
// above), each drifting at a slightly different scroll speed.
const WORN_ITEMS = [
  { piece: mazal, galleryIndex: 1, speed: -6 },
  { piece: bracha, galleryIndex: 2, speed: 10 },
  { piece: galya, galleryIndex: 1, speed: -10 },
  { piece: jeanine, galleryIndex: 1, speed: 6 },
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
      <WornGallery items={WORN_ITEMS} />
    </main>
  )
}
