import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { useLanguage } from '../i18n/LanguageContext'
import { useCatalog } from '../data/CatalogContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { consumePendingTransition } from '../transitionStore'
import { Gallery } from '../components/Gallery'
import styles from './PieceDetail.module.css'

export function PieceDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { locale } = useLanguage()
  const { pieces, loading, error } = useCatalog()
  const piece = pieces.find((p) => p.slug === slug)
  const heroImgRef = useRef<HTMLImageElement>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const infoRef = useScrollReveal<HTMLDivElement>()
  const transitionRanRef = useRef(false)

  // The signature moment: the clicked carousel card's cover image morphs
  // into place over the real (fading-in) hero image, then disappears.
  // Guarded to run once: `piece` only becomes defined once the catalog
  // finishes loading, so this effect fires on that transition, not on mount.
  useLayoutEffect(() => {
    if (!piece || transitionRanRef.current) return
    const pending = consumePendingTransition(piece.slug)
    const heroImg = heroImgRef.current
    if (!pending || !heroImg) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    transitionRanRef.current = true

    const targetRect = heroImg.getBoundingClientRect()
    const overlay = document.createElement('img')
    overlay.src = pending.src
    overlay.className = styles.transitionClone
    overlay.style.top = `${pending.rect.top}px`
    overlay.style.left = `${pending.rect.left}px`
    overlay.style.width = `${pending.rect.width}px`
    overlay.style.height = `${pending.rect.height}px`
    document.body.appendChild(overlay)
    setOverlayVisible(true)

    gsap.to(overlay, {
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      duration: 0.75,
      ease: 'power3.inOut',
      onComplete: () => {
        overlay.remove()
        setOverlayVisible(false)
      },
    })

    return () => overlay.remove()
  }, [piece])

  if (loading) {
    return (
      <main className={styles.main} aria-busy="true">
        <div className={styles.loadingMark} />
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.main}>
        <p>{locale === 'he' ? 'שגיאה בטעינת הפריט. נסו לרענן.' : 'Something went wrong loading this piece. Try refreshing.'}</p>
        <Link to="/" className={styles.back}>
          {locale === 'he' ? '← חזרה לאוסף' : '← Back to collection'}
        </Link>
      </main>
    )
  }

  if (!piece) {
    return (
      <main className={styles.main}>
        <p>{locale === 'he' ? 'הפריט לא נמצא' : 'Piece not found'}</p>
        <Link to="/" className={styles.back}>
          {locale === 'he' ? '← חזרה לאוסף' : '← Back to collection'}
        </Link>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <Link to="/" className={styles.back}>
        {locale === 'he' ? '← חזרה לאוסף' : '← Back to collection'}
      </Link>
      <div className={overlayVisible ? `${styles.galleryWrap} ${styles.galleryHidden}` : styles.galleryWrap}>
        <Gallery items={piece.gallery} firstImageRef={heroImgRef} />
      </div>
      <div ref={infoRef} className={styles.info}>
        <h1 className={styles.name}>{piece.name[locale]}</h1>
        <p className={styles.materials}>{piece.materials[locale]}</p>
        <p className={styles.description}>{piece.description[locale]}</p>
      </div>
    </main>
  )
}
