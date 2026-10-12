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
}

interface BrandFilmstripProps {
  items: FilmstripItem[]
}

/**
 * The signature scroll moment: the section pins full-screen while the page
 * scrolls, translating a long horizontal strip of mixed-size shots sideways
 * underneath — a cinematic "wipe through the collection" beat, instead of
 * another vertical reveal.
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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Reduced motion: no pin/scrub — let it scroll as a plain horizontal strip.
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
        {items.map(({ media, size }, i) => (
          <div key={i} className={`${styles.tile} ${styles[size]}`}>
            {media.kind === 'photo' ? (
              <img src={media.large} alt={media.alt[locale]} loading="lazy" />
            ) : (
              <FilmstripVideo
                media={media}
                active={activeVideo === i}
                onActivate={() => setActiveVideo(i)}
              />
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
