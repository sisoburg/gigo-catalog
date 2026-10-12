import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PieceMedia } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './BrandFilmstrip.module.css'

gsap.registerPlugin(ScrollTrigger)

export interface FilmstripItem {
  media: PieceMedia
  /** Controls the tile's width/aspect via a CSS size class for visual rhythm. */
  size: 'tall' | 'square' | 'wide'
  /** "float" tiles are smaller, rotated, shadowed, and overlap the tile before them — a loose collage instead of a grid. */
  layer: 'base' | 'float'
  /** Fixed per-tile tilt in degrees, only used for float tiles. */
  rotate?: number
}

interface BrandFilmstripProps {
  items: FilmstripItem[]
}

/**
 * The signature scroll moment: the section pins full-screen while the page
 * scrolls, translating a long horizontal strip underneath — a cinematic
 * "wipe through the collection" beat. Smaller "float" tiles overlap the
 * larger ones like a loosely pinned collage, and the whole strip settles
 * into place with a staggered scale/fade the first time it's reached.
 */
export function BrandFilmstrip({ items }: BrandFilmstripProps) {
  const { locale } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [activeVideo, setActiveVideo] = useState<number | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      gsap.set(track.children, { opacity: 1, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - section.clientWidth
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true,
          onEnter: () => {
            gsap.fromTo(
              track.children,
              { opacity: 0, scale: 0.8 },
              { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)', stagger: { each: 0.045, from: 'start' } },
            )
          },
        },
      })
      return () => tween.scrollTrigger?.kill()
    }, section)

    return () => ctx.revert()
  }, [items])

  return (
    <section ref={sectionRef} className={styles.section}>
      <p className={styles.eyebrow}>{locale === 'he' ? 'האווירה' : 'The Vibe'}</p>
      <div ref={trackRef} className={styles.track}>
        {items.map(({ media, size, layer, rotate }, i) => (
          <div
            key={i}
            className={layer === 'float' ? `${styles.tile} ${styles[size]} ${styles.float}` : `${styles.tile} ${styles[size]}`}
            style={layer === 'float' ? { transform: `rotate(${rotate ?? 0}deg)` } : undefined}
          >
            {media.kind === 'photo' ? (
              <img src={media.large} alt={media.alt[locale]} loading="lazy" />
            ) : (
              <FilmstripVideo media={media} active={activeVideo === i} onActivate={() => setActiveVideo(i)} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function FilmstripVideo({
  media,
  active,
  onActivate,
}: {
  media: Extract<PieceMedia, { kind: 'video' }>
  active: boolean
  onActivate: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useLayoutEffect(() => {
    const el = videoRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onActivate()
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <video
      ref={videoRef}
      poster={media.poster}
      src={media.src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={media.alt.en}
      data-active={active || undefined}
    />
  )
}
