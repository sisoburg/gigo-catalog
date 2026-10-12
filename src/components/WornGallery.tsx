import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Piece } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { setPendingTransition } from '../transitionStore'
import styles from './WornGallery.module.css'

gsap.registerPlugin(ScrollTrigger)

interface WornItem {
  piece: Piece
  /** Index into piece.gallery for the on-body shot to feature here. */
  galleryIndex: number
  /** Relative parallax speed; small variation per item keeps the stagger from feeling mechanical. */
  speed: number
}

interface WornGalleryProps {
  items: WornItem[]
}

export function WornGallery({ items }: WornGalleryProps) {
  const { locale } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  useLayoutEffect(() => {
    const section = sectionRef.current
    const heading = headingRef.current
    if (!section || !heading) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(heading, { opacity: 1, y: 0 })
        gsap.set(itemRefs.current, { opacity: 1, y: 0 })
        return
      }

      gsap.fromTo(
        heading,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: heading, start: 'top 85%', once: true } },
      )

      // Entrance: each card rises and settles in as it reaches the viewport.
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        )
        // Ambient parallax: cards drift at slightly different speeds while the section scrolls by.
        gsap.to(el, {
          yPercent: items[i].speed,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    }, section)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div ref={headingRef} className={styles.heading}>
        <p className={styles.eyebrow}>{locale === 'he' ? 'על הגוף' : 'Worn'}</p>
        <h2>{locale === 'he' ? 'כל פריט מספר סיפור אחר על הגוף' : 'Every piece sits differently on the body'}</h2>
      </div>
      <div className={styles.grid}>
        {items.map(({ piece, galleryIndex }, i) => {
          const media = piece.gallery[galleryIndex]
          if (media.kind !== 'photo') return null
          return (
            <Link
              key={piece.slug + galleryIndex}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              to={`/piece/${piece.slug}`}
              className={styles.item}
              onClick={(e) => {
                const img = e.currentTarget.querySelector('img')
                if (img) setPendingTransition({ slug: piece.slug, rect: img.getBoundingClientRect(), src: media.src })
              }}
            >
              <img src={media.src} alt={media.alt[locale]} loading="lazy" />
              <span className={styles.itemLabel}>{piece.name[locale]}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
