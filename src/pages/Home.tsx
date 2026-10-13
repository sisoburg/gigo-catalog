import { useMemo } from 'react'
import { Hero } from '../components/Hero'
import { Carousel } from '../components/Carousel'
import { WornStory } from '../components/worn/WornStory'
import { WornLayers } from '../components/worn/WornLayers'
import { WornCustom } from '../components/worn/WornCustom'
import { useLanguage } from '../i18n/LanguageContext'
import { useCatalog } from '../data/CatalogContext'
import { useFilmstripItems } from '../data/useFilmstripItems'
import { useScrollReveal } from '../hooks/useScrollReveal'
import type { Piece, PieceMedia } from '../data/types'
import styles from './Home.module.css'

/** Fallback when nothing is curated in /admin/worn: one fresh shot per piece,
 *  preferring photos beyond the cover and the carousel's hover-preview shot. */
function buildAutoLayerMedia(pieces: Piece[]): PieceMedia[] {
  const media: PieceMedia[] = []
  for (const piece of pieces) {
    const fresh = piece.gallery.slice(2)
    const pool = fresh.length > 0 ? fresh : piece.gallery
    const pick = pool.find((m) => m.kind === 'video') ?? pool[0]
    if (pick) media.push(pick)
  }
  return media
}

export function Home() {
  const { locale } = useLanguage()
  const { pieces, hero, loading, error } = useCatalog()
  const { items: curatedFilmstripItems } = useFilmstripItems()
  const headingRef = useScrollReveal<HTMLDivElement>()
  const layerMedia = useMemo(() => {
    if (curatedFilmstripItems && curatedFilmstripItems.length > 0) return curatedFilmstripItems
    return buildAutoLayerMedia(pieces)
  }, [curatedFilmstripItems, pieces])

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
        <p>{locale === 'he' ? 'שגיאה בטעינת הקולקציה. נסו לרענן.' : 'Something went wrong loading the collection. Try refreshing.'}</p>
      </main>
    )
  }

  if (pieces.length === 0) {
    return (
      <main className={styles.state}>
        <p>{locale === 'he' ? 'הקולקציה תתעדכן בקרוב.' : 'The collection is being updated — check back soon.'}</p>
      </main>
    )
  }

  return (
    <main>
      {hero && <Hero media={hero} />}
      <section className={styles.collection}>
        <div ref={headingRef} className={styles.heading}>
          <h2>{locale === 'he' ? 'הקולקציה' : 'The Collection'}</h2>
        </div>
        <Carousel pieces={pieces} />
      </section>
      <WornStory pieces={pieces} />
      {layerMedia.length > 0 && <WornLayers items={layerMedia} />}
      <WornCustom pieces={pieces} />
    </main>
  )
}
