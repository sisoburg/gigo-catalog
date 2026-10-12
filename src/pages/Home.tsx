import { useMemo } from 'react'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { BrandFilmstrip, type FilmstripItem } from '../components/BrandFilmstrip'
import { WornInterlude } from '../components/WornInterlude'
import { WornReveal } from '../components/WornReveal'
import { useLanguage } from '../i18n/LanguageContext'
import { useCatalog } from '../data/CatalogContext'
import { useFilmstripItems } from '../data/useFilmstripItems'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Piece, PieceMedia } from '../data/types'
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

interface RevealData {
  heroMedia: PieceMedia
  heroLabel: string
  gridItems: PieceMedia[]
}

/** The reveal's hero plus a 6-up grid, pulled from pieces' later gallery
 *  shots (not covers) so it reads as fresh material rather than a repeat
 *  of the carousel above it. */
function buildRevealData(pieces: Piece[], locale: 'en' | 'he'): RevealData | null {
  if (pieces.length === 0) return null
  const heroIndex = Math.min(2, pieces.length - 1)
  const heroPiece = pieces[heroIndex]
  const heroMedia = heroPiece.gallery[2] ?? heroPiece.gallery[1] ?? heroPiece.cover

  const gridItems: PieceMedia[] = []
  for (let i = 1; i <= pieces.length && gridItems.length < 6; i++) {
    const piece = pieces[(heroIndex + i) % pieces.length]
    const media = piece.gallery[1] ?? piece.gallery[0] ?? piece.cover
    gridItems.push(media)
  }
  if (gridItems.length < 3) return null

  return { heroMedia, heroLabel: heroPiece.name[locale], gridItems }
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
  const revealData = useMemo(() => buildRevealData(pieces, locale), [pieces, locale])

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
      {revealData && (
        <>
          <WornInterlude />
          <WornReveal heroMedia={revealData.heroMedia} heroLabel={revealData.heroLabel} gridItems={revealData.gridItems} />
        </>
      )}
    </main>
  )
}
