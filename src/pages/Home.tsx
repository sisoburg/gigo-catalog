import { useMemo } from 'react'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { BrandFilmstrip, type FilmstripItem } from '../components/BrandFilmstrip'
import { useLanguage } from '../i18n/LanguageContext'
import { useCatalog } from '../data/CatalogContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Piece } from '../data/types'
import styles from './Home.module.css'

/** Builds the filmstrip's loose collage: one larger "base" shot per piece,
 *  plus — when the piece has a video or a second distinct photo — a smaller
 *  rotated "float" tile overlapping it, so related shots of the same piece
 *  drift through the strip together. Skips gracefully if a piece has no
 *  photos yet. */
function buildFilmstripItems(pieces: Piece[]): FilmstripItem[] {
  const baseSizes: FilmstripItem['size'][] = ['tall', 'square', 'wide']
  const floatSizes: FilmstripItem['size'][] = ['square', 'tall', 'wide']
  const rotations = [-6, 4, -5, 6, -3, 5]
  const items: FilmstripItem[] = []
  let sizeIndex = 0
  for (const piece of pieces) {
    const basePhoto = piece.gallery[1] ?? piece.gallery[0]
    if (!basePhoto) continue
    items.push({ media: basePhoto, size: baseSizes[sizeIndex % baseSizes.length], layer: 'base' })

    const video = piece.gallery.find((m) => m.kind === 'video')
    const floatCandidate = video ?? piece.gallery.find((m) => m !== basePhoto && m.kind === 'photo')
    if (floatCandidate) {
      items.push({
        media: floatCandidate,
        size: floatSizes[sizeIndex % floatSizes.length],
        layer: 'float',
        rotate: rotations[items.length % rotations.length],
      })
    }
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
