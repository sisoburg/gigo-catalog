import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/strings'
import styles from './Hero.module.css'

gsap.registerPlugin(ScrollTrigger)

interface HeroProps {
  imageSrc: string
  imageAlt: string
}

export function Hero({ imageSrc, imageAlt }: HeroProps) {
  const { locale } = useLanguage()
  const sectionRef = useRef<HTMLElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const image = imageRef.current
    const content = contentRef.current
    if (!section || !image || !content) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(image, { scale: 1 })
      gsap.set(content, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      // Entrance: image settles in from a slight overscale, text rises in behind it.
      gsap.fromTo(image, { scale: 1.12 }, { scale: 1.04, duration: 1.6, ease: 'power2.out' })
      gsap.fromTo(
        content,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 1.1, delay: 0.3, ease: 'power2.out' },
      )
      // Ambient parallax: the image drifts slightly slower than the page as you scroll past it.
      gsap.to(image, {
        scale: 1.16,
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className={styles.hero}>
      <img ref={imageRef} className={styles.image} src={imageSrc} alt={imageAlt} />
      <div className={styles.scrim} />
      <div ref={contentRef} className={styles.content}>
        <p className={styles.tagline}>{t('tagline', locale)}</p>
        <h1 className={styles.title}>{t('siteName', locale)}</h1>
      </div>
    </section>
  )
}
