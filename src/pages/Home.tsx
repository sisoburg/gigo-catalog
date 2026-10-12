import { useMemo } from 'react'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { BrandFilmstrip, type FilmstripItem } from '../components/BrandFilmstrip'
import { useLanguage } from '../i18n/LanguageContext'
import { useCatalog } from '../data/CatalogContext'
import { useFilmstripItems } from '../data/useFilmstripItems'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Piece } from '../data/types'
import styles from './Home.module.css'

const FLOAT_ROTATIONS = [-6, 4, -5, 6, -3, 5]

/** Curated items (from /admin/worn) don't store a rotation — assign one by
 *  position, same as the auto-built path below. */
function assignFloatRotations(items: FilmstripItem[]): FilmstripItem[] {
  let floatIndex = 0
  return items.map((item) => {
    if (item.layer !== 'float') return item
    const rotate = FLOAT_ROTATIONS[floatIndex % FLOAT_ROTATIONS.length]
    floatIndex++
    return { ...item, rotate }
  })
}

/** Builds the filmstrip's loose collage: one larger "base" shot per piece,
 *  plus — when a second distinct shot (or a video) is available — a smaller
 *  rotated "float" tile overlapping it, so related shots of the same piece
 *  drift through the strip together. Prefers photos beyond index 1 (the
 *  cover and the carousel's hover-preview shot) so this section shows
 *  genuinely different images instead of repeating what's already visible
 *  higher up the page. Skips gracefully if a piece has no photos yet. */
function buildFilmstripItems(pieces: Piece[]): FilmstripItem[] {
  const baseSizes: FilmstripItem['size'][] = ['tall', 'square', 'wide']
  const floatSizes: FilmstripItem['size'][] = ['square', 'tall', 'wide']
  const rotations = [-6, 4, -5, 6, -3, 5]
  const items: FilmstripItem[] = []
  let sizeIndex = 0
  for (const piece of pieces) {
    const fresh = piece.gallery.slice(2)
    const pool = fresh.length > 0 ? fresh : piece.gallery
    if (pool.length === 0) continue

    const video = pool.find((m) => m.kind === 'video')
    const basePhoto = pool.find((m) => m.kind === 'photo') ?? pool[0]
    items.push({ media: basePhoto, size: baseSizes[sizeIndex % baseSizes.length], layer: 'base' })

    const floatCandidate = video ?? pool.find((m) => m !== basePhoto)
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
  const { items: curatedFilmstripItems } = useFilmstripItems()
  const headingRef = useScrollReveal<HTMLDivElement>()
  const autoFilmstripItems = useMemo(() => buildFilmstripItems(pieces), [pieces])
  const filmstripItems = useMemo(() => {
    if (curatedFilmstripItems && curatedFilmstripItems.length > 0) return assignFloatRotations(curatedFilmstripItems)
    return autoFilmstripItems
  }, [curatedFilmstripItems, autoFilmstripItems])

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
