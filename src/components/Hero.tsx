import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/strings'
import type { HeroMedia } from '../data/types'
import logoWhite from '../assets/brand/logo-white.png'
import styles from './Hero.module.css'

gsap.registerPlugin(ScrollTrigger)

interface HeroProps {
  media: HeroMedia
}

export function Hero({ media }: HeroProps) {
  const { locale } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const mediaEl = mediaRef.current
    const content = contentRef.current
    if (!section || !mediaEl || !content) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(mediaEl, { scale: 1 })
      gsap.set(content, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      // Entrance: media settles in from a slight overscale, text rises in behind it.
      gsap.fromTo(mediaEl, { scale: 1.12 }, { scale: 1.04, duration: 1.6, ease: 'power2.out' })
      gsap.fromTo(
        content,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 1.1, delay: 0.3, ease: 'power2.out' },
      )
      // Ambient parallax: the media drifts slightly slower than the page as you scroll past it.
      gsap.to(mediaEl, {
        scale: 1.16,
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, section)

    return () => ctx.revert()
  }, [media])

  return (
    <section ref={sectionRef} className={styles.hero}>
      {media.kind === 'video' ? (
        <video
          ref={mediaRef as React.Ref<HTMLVideoElement>}
          className={styles.image}
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img ref={mediaRef as React.Ref<HTMLImageElement>} className={styles.image} src={media.src} alt={t('siteName', locale)} />
      )}
      <div className={styles.scrim} />
      <div ref={contentRef} className={styles.content}>
        <p className={styles.tagline}>{t('tagline', locale)}</p>
        <h1 className={styles.title}>
          <img className={styles.logo} src={logoWhite} alt={t('siteName', locale)} />
        </h1>
      </div>
    </section>
  )
}
