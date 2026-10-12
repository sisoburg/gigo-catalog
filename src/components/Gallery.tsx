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

  // Native listener, not React's onWheel — see Carousel.tsx for why
  // (React's synthetic wheel handler is passive, so preventDefault is a no-op there).
  const zoomedRef = useRef(zoomedIndex)
  zoomedRef.current = zoomedIndex
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onWheel = (e: WheelEvent) => {
      if (zoomedRef.current !== null) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      track.scrollLeft += e.deltaY
      e.preventDefault()
    }
    track.addEventListener('wheel', onWheel, { passive: false })
    return () => track.removeEventListener('wheel', onWheel)
  }, [])

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

  // Measured from scrollLeft rather than IntersectionObserver — see Carousel.tsx
  // for why: IO callbacks only report entries whose ratio just crossed the
  // threshold, not a full re-scan, which misidentifies the active slide.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    let frame = 0

    const update = () => {
      frame = 0
      const viewportCenter = track.scrollLeft + track.clientWidth / 2
      let closestIndex = 0
      let closestDistance = Infinity
      Array.from(track.children).forEach((child, i) => {
        const el = child as HTMLElement
        const center = el.offsetLeft + el.offsetWidth / 2
        const distance = Math.abs(center - viewportCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = i
        }
      })
      setActiveIndex(closestIndex)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  return (
    <div className={styles.wrapper}>
      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={onPointerDown}
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
                src={item.large}
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
