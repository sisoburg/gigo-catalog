import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PieceMedia } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { ScrambleHeading } from './ScrambleHeading'
import { scrollToY } from './SmoothScroll'
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
 * scrolls, translating a long horizontal strip underneath. Beyond that base
 * slide, three more things move: the heading tumbles into place letter by
 * letter, "float" tiles continuously bob and rotate as the strip passes
 * (not just a flat slide), and base tiles breathe with a slow scale pulse —
 * so there's always something alive on screen, not just one horizontal pan.
 * Up/down buttons let a visitor skip the whole pinned stretch if they'd
 * rather not scroll through it.
 */
export function BrandFilmstrip({ items }: BrandFilmstripProps) {
  const { locale } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const tileRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
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
            // Targets the inner wrapper, not the tile itself — the tile's own
            // transform is owned by onUpdate below (continuous bob/rotate/scale),
            // so splitting them onto separate elements avoids the two fighting
            // over the same CSS property every scroll frame.
            gsap.fromTo(
              track.querySelectorAll(`.${styles.tileInner}`),
              { opacity: 0, scale: 0.8 },
              { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.5)', stagger: { each: 0.045, from: 'start' } },
            )
          },
          onUpdate: (self) => {
            // Continuous motion tied to scroll progress, independent of the
            // flat horizontal slide: float tiles bob vertically and spin a
            // little extra past their resting tilt; base tiles breathe.
            items.forEach((item, i) => {
              const el = tileRefs.current[i]
              if (!el) return
              const phase = self.progress * Math.PI * 2 + i * 1.7
              if (item.layer === 'float') {
                const bob = Math.sin(phase) * 14
                const spin = (item.rotate ?? 0) + Math.sin(phase * 0.6) * 6
                el.style.transform = `translateY(${bob}px) rotate(${spin}deg)`
              } else {
                const scale = 1 + Math.sin(phase * 0.8) * 0.035
                el.style.transform = `scale(${scale})`
              }
            })
          },
        },
      })
      scrollTriggerRef.current = tween.scrollTrigger ?? null
      return () => tween.scrollTrigger?.kill()
    }, section)

    return () => ctx.revert()
  }, [items])

  const skip = (direction: 'up' | 'down') => {
    // Read the live pin-spacer geometry rather than the ScrollTrigger
    // instance's cached start/end — those go stale relative to the actual
    // pin boundary once Lenis's own scroll-driven recalculation is in the
    // mix, which left "skip down" landing short, still inside the pin.
    const spacer = sectionRef.current?.closest<HTMLElement>('.pin-spacer')
    if (!spacer) return
    const top = spacer.getBoundingClientRect().top + window.scrollY
    const target = direction === 'down' ? top + spacer.offsetHeight + 40 : top - 40
    scrollToY(target)
  }

  return (
    <section ref={sectionRef} className={styles.section}>
      <p className={styles.eyebrow}>{locale === 'he' ? 'האווירה' : 'The Vibe'}</p>
      <ScrambleHeading text={locale === 'he' ? 'איך זה נראה עלינו' : 'How It Lives'} className={styles.heading} />
      <div className={styles.skipControls}>
        <button type="button" className={styles.skipButton} onClick={() => skip('up')} aria-label={locale === 'he' ? 'דלג למעלה' : 'Skip up'}>
          <SkipIcon />
        </button>
        <button
          type="button"
          className={styles.skipButton}
          onClick={() => skip('down')}
          aria-label={locale === 'he' ? 'דלג למטה' : 'Skip down'}
        >
          <SkipIcon flipped />
        </button>
      </div>
      <div ref={trackRef} className={styles.track}>
        {items.map(({ media, size, layer, rotate }, i) => (
          <div
            key={i}
            ref={(el) => {
              tileRefs.current[i] = el
            }}
            className={layer === 'float' ? `${styles.tile} ${styles[size]} ${styles.float}` : `${styles.tile} ${styles[size]}`}
            style={layer === 'float' ? { transform: `rotate(${rotate ?? 0}deg)` } : undefined}
          >
            <div className={styles.tileInner}>
              {media.kind === 'photo' ? (
                <img src={media.large} alt={media.alt[locale]} loading="lazy" />
              ) : (
                <FilmstripVideo media={media} active={activeVideo === i} onActivate={() => setActiveVideo(i)} />
              )}
            </div>
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

function SkipIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" style={flipped ? { transform: 'scaleY(-1)' } : undefined} aria-hidden="true">
      <path d="M7 17V1M7 1L1 7M7 1L13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
