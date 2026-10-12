import { useMemo } from 'react'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { BrandFilmstrip, type FilmstripItem } from '../components/BrandFilmstrip'
import { useLanguage } from '../i18n/LanguageContext'
import { useCatalog } from '../data/CatalogContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Piece } from '../data/types'
import styles from './Home.module.css'

/** Pulls a few photos spread across the collection for the filmstrip's mixed
 *  sizes, skipping gracefully if a piece doesn't have that many photos yet. */
function buildFilmstripItems(pieces: Piece[]): FilmstripItem[] {
  const sizes: FilmstripItem['size'][] = ['tall', 'square', 'wide']
  const items: FilmstripItem[] = []
  let sizeIndex = 0
  for (const piece of pieces) {
    const media = piece.gallery[1] ?? piece.gallery[0]
    if (!media) continue
    items.push({ media, size: sizes[sizeIndex % sizes.length] })
    sizeIndex++
  }
  return items
}

export function Home() {
  const { locale } = useLanguage()
  const { pieces, hero, loading, error } = useCatalog()
  const headingRef = useScrollReveal<HTMLDivElement>()
  const filmstripItems = useMemo(() => buildFilmstripItems(pieces), [pieces])

  if (loading) {
    return (
      <main className={styles.loading} aria-busy="true">
        <div className={styles.loadingMark} />
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.state}>
        <p>{locale === 'he' ? 'שגיאה בטעינת האוסף. נסו לרענן.' : 'Something went wrong loading the collection. Try refreshing.'}</p>
      </main>
    )
  }

  if (pieces.length === 0) {
    return (
      <main className={styles.state}>
        <p>{locale === 'he' ? 'האוסף יעודכן בקרוב.' : 'The collection is being updated — check back soon.'}</p>
      </main>
    )
  }

  return (
    <main>
      {hero && <Hero media={hero} />}
      <section className={styles.collection}>
        <div ref={headingRef} className={styles.heading}>
          <h2>{locale === 'he' ? 'האוסף' : 'The Collection'}</h2>
        </div>
        <Carousel pieces={pieces} />
      </section>
      {filmstripItems.length > 0 && <BrandFilmstrip items={filmstripItems} />}
    </main>
  )
}
