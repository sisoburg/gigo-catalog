import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { PieceMedia } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './Gallery.module.css'

interface GalleryProps {
  items: PieceMedia[]
  /** The first slide's <img> is the morph target for the carousel->detail transition. */
  firstImageRef?: React.Ref<HTMLImageElement>
}

const DRAG_CLICK_THRESHOLD = 6

export function Gallery({ items, firstImageRef }: GalleryProps) {
  const { locale, dir } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)

  const dragState = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null)

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || zoomedIndex !== null) return
    const track = trackRef.current
    if (!track) return
    dragState.current = { startX: e.clientX, startScrollLeft: track.scrollLeft, moved: false }

    const onMove = (ev: PointerEvent) => {
      const state = dragState.current
      if (!state) return
      const delta = ev.clientX - state.startX
      if (Math.abs(delta) > DRAG_CLICK_THRESHOLD) state.moved = true
      track.scrollLeft = state.startScrollLeft - delta
    }
    const onUp = () => {
      const state = dragState.current
      if (state?.moved) {
        const onClickOnce = (ev: MouseEvent) => {
          ev.preventDefault()
          ev.stopPropagation()
        }
        track.addEventListener('click', onClickOnce, { capture: true, once: true })
      }
      dragState.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomedIndex])

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track || zoomedIndex !== null) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    track.scrollLeft += e.deltaY
    e.preventDefault()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomedIndex])

  const goToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current
      if (!track) return
      const clamped = Math.max(0, Math.min(items.length - 1, index))
      const item = track.children[clamped] as HTMLElement | undefined
      item?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    },
    [items.length],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const visualStep = (visualRight: boolean) => (dir === 'rtl' ? (visualRight ? -1 : 1) : visualRight ? 1 : -1)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToIndex(activeIndex + visualStep(true))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToIndex(activeIndex + visualStep(false))
      } else if (e.key === 'Escape' && zoomedIndex !== null) {
        setZoomedIndex(null)
      }
    },
    [activeIndex, dir, goToIndex, zoomedIndex],
  )

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((en) => en.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          const index = Number((visible[0].target as HTMLElement).dataset.galleryItem)
          if (!Number.isNaN(index)) setActiveIndex(index)
        }
      },
      { root: track, threshold: [0.6] },
    )
    Array.from(track.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [items])

  return (
    <div className={styles.wrapper}>
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={onPointerDown}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
      >
        {items.map((item, index) => (
          <div key={index} className={styles.slide} data-gallery-item={index}>
            {item.kind === 'photo' ? (
              <img
                ref={index === 0 ? firstImageRef : undefined}
                className={zoomedIndex === index ? `${styles.media} ${styles.zoomed}` : styles.media}
                src={item.src}
                alt={item.alt[locale]}
                loading={index === 0 ? 'eager' : 'lazy'}
                onClick={() => setZoomedIndex((z) => (z === index ? null : index))}
              />
            ) : (
              <GalleryVideo item={item} active={index === activeIndex} alt={item.alt[locale]} />
            )}
          </div>
        ))}
      </div>
      <div className={styles.dashes} aria-hidden="true">
        {items.map((_, index) => (
          <span key={index} className={index === activeIndex ? styles.dashActive : styles.dash} />
        ))}
      </div>
    </div>
  )
}

function GalleryVideo({
  item,
  active,
  alt,
}: {
  item: Extract<PieceMedia, { kind: 'video' }>
  active: boolean
  alt: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (active) video.play().catch(() => {})
    else video.pause()
  }, [active])

  return (
    <video
      ref={videoRef}
      className={styles.media}
      poster={item.poster}
      src={item.src}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
    />
  )
}
