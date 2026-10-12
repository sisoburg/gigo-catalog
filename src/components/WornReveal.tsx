import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { PieceMedia } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { PinSkipControls } from './PinSkipControls'
import styles from './WornReveal.module.css'

gsap.registerPlugin(ScrollTrigger)

interface WornRevealProps {
  heroMedia: PieceMedia
  heroLabel: string
  gridItems: PieceMedia[]
}

/**
 * A second, different kind of scroll moment from the horizontal filmstrip:
 * one photo fills the screen, then zooms out and shrinks into a grid cell
 * as the rest of the grid fades in around it — a "pull back to reveal the
 * whole wall" beat, pinned and scroll-scrubbed like the filmstrip but
 * built from scale/opacity instead of horizontal translation.
 */
export function WornReveal({ heroMedia, heroLabel, gridItems }: WornRevealProps) {
  const { locale } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const labelRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const hero = heroRef.current
    const label = labelRef.current
    const grid = gridRef.current
    if (!section || !hero || !label || !grid) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(hero, { scale: 1 })
      gsap.set(grid.children, { opacity: 1, scale: 1 })
      gsap.set(label, { opacity: 0 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          scrub: 0.6,
          pin: true,
        },
      })
      tl.to(hero, { scale: 0.3, ease: 'power2.inOut', duration: 1 }, 0)
        .to(label, { opacity: 0, y: -50, ease: 'power1.out', duration: 0.35 }, 0)
        .fromTo(grid.children, { opacity: 0, scale: 0.75 }, { opacity: 1, scale: 1, stagger: 0.07, ease: 'power2.out', duration: 0.6 }, 0.28)
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className={styles.section}>
      <div ref={gridRef} className={styles.grid}>
        {gridItems.map((item, i) => (
          <div key={i} className={styles.cell}>
            {item.kind === 'photo' ? <img src={item.medium} alt={item.alt[locale]} loading="lazy" /> : <GridVideo item={item} />}
          </div>
        ))}
      </div>
      <div ref={heroRef} className={styles.hero}>
        {heroMedia.kind === 'photo' ? (
          <img src={heroMedia.large} alt={heroMedia.alt[locale]} loading="lazy" />
        ) : (
          <video src={heroMedia.src} poster={heroMedia.poster} muted loop playsInline autoPlay />
        )}
      </div>
      <div ref={labelRef} className={styles.label}>
        <h3>{heroLabel}</h3>
      </div>
      <PinSkipControls
        sectionRef={sectionRef}
        upLabel={locale === 'he' ? 'דלג למעלה' : 'Skip up'}
        downLabel={locale === 'he' ? 'דלג למטה' : 'Skip down'}
      />
    </section>
  )
}

function GridVideo({ item }: { item: Extract<PieceMedia, { kind: 'video' }> }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useLayoutEffect(() => {
    const el = videoRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <video ref={videoRef} src={item.src} poster={item.poster} muted loop playsInline preload="metadata" />
}
