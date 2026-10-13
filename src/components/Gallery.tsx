import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { PieceMedia } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './Gallery.module.css'

interface GalleryProps {
  items: PieceMedia[]
  /** The first slide's <img> is the morph target for the carousel->detail transition. */
  firstImageRef?: React.Ref<HTMLImageElement>
}

const DRAG_CLICK_THRESHOLD = 6
const SETTLE_DELAY_MS = 150

interface TrackItem {
  item: PieceMedia
  realIndex: number
}

export function Gallery({ items, firstImageRef }: GalleryProps) {
  const { locale, dir } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null)
  const domIndexRef = useRef(0)

  // Loop illusion: a clone of the last slide sits before the real run, and a
  // clone of the first sits after it — no visible seam like the main
  // carousel's cap, since photos (and the zoom interaction) read fine
  // repeating directly. Swiping past either end lands on a clone that's
  // visually identical to the real slide it mirrors, at which point we
  // silently snap scrollLeft onto the real one. See Carousel.tsx for the
  // same technique with more detail.
  const trackItems = useMemo<TrackItem[]>(() => {
    if (items.length === 0) return []
    return [
      { item: items[items.length - 1], realIndex: items.length - 1 },
      ...items.map((item, i) => ({ item, realIndex: i })),
      { item: items[0], realIndex: 0 },
    ]
  }, [items])

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
    (index: number, instant = false) => {
      const track = trackRef.current
      if (!track) return
      const clamped = Math.max(0, Math.min(trackItems.length - 1, index))
      const item = track.children[clamped] as HTMLElement | undefined
      item?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
    },
    [trackItems.length],
  )

  // Land on the real first slide (domIndex 1, past the leading clone) instead
  // of wherever the browser's default scroll position would be.
  useLayoutEffect(() => {
    goToIndex(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  // Physical-left/right, not mirrored by language direction — see Carousel.tsx.
  const visualStep = useCallback((towardVisualRight: boolean) => (dir === 'rtl' ? (towardVisualRight ? -1 : 1) : towardVisualRight ? 1 : -1), [dir])
  const goVisualLeft = useCallback(() => goToIndex(domIndexRef.current + visualStep(false)), [goToIndex, visualStep])
  const goVisualRight = useCallback(() => goToIndex(domIndexRef.current + visualStep(true)), [goToIndex, visualStep])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goVisualRight()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goVisualLeft()
      } else if (e.key === 'Escape' && zoomedIndex !== null) {
        setZoomedIndex(null)
      }
    },
    [goVisualLeft, goVisualRight, zoomedIndex],
  )

  // Measured from scrollLeft rather than IntersectionObserver — see Carousel.tsx
  // for why: IO callbacks only report entries whose ratio just crossed the
  // threshold, not a full re-scan, which misidentifies the active slide.
  useEffect(() => {
    const track = trackRef.current
    if (!track || trackItems.length === 0) return
    let frame = 0
    let settleTimer = 0

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
      domIndexRef.current = closestIndex
      setActiveIndex(trackItems[closestIndex].realIndex)

      if (settleTimer) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        // Settled on the leading clone -> hop onto the real last slide;
        // settled on the trailing clone -> hop onto the real first slide.
        // Same position visually, so the jump is invisible.
        if (closestIndex === 0) goToIndex(trackItems.length - 2, true)
        else if (closestIndex === trackItems.length - 1) goToIndex(1, true)
      }, SETTLE_DELAY_MS)
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
      if (settleTimer) window.clearTimeout(settleTimer)
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [trackItems, goToIndex])

  return (
    <div className={styles.wrapper}>
      <div className={styles.viewport}>
        {items.length > 1 && (
          <button
            type="button"
            className={styles.arrowLeft}
            onClick={goVisualLeft}
            aria-label={locale === 'he' ? 'הקודם' : 'Previous'}
          >
            <ArrowIcon flipped />
          </button>
        )}
        <div
          ref={trackRef}
          className={styles.track}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
        >
          {trackItems.map((entry, domIndex) => {
            const { item, realIndex } = entry
            const isRealFirst = domIndex === 1
            return (
              <div key={`${realIndex}-${domIndex}`} className={styles.slide} data-gallery-item={realIndex}>
                {item.kind === 'photo' ? (
                  <img
                    ref={isRealFirst ? firstImageRef : undefined}
                    className={zoomedIndex === realIndex ? `${styles.media} ${styles.zoomed}` : styles.media}
                    src={item.large}
                    alt={item.alt[locale]}
                    loading={isRealFirst ? 'eager' : 'lazy'}
                    onClick={() => setZoomedIndex((z) => (z === realIndex ? null : realIndex))}
                  />
                ) : (
                  <GalleryVideo item={item} active={realIndex === activeIndex} alt={item.alt[locale]} />
                )}
              </div>
            )
          })}
        </div>
        {items.length > 1 && (
          <button
            type="button"
            className={styles.arrowRight}
            onClick={goVisualRight}
            aria-label={locale === 'he' ? 'הבא' : 'Next'}
          >
            <ArrowIcon />
          </button>
        )}
      </div>
      {items.length > 1 && (
        <div className={styles.thumbs} role="tablist" aria-label={locale === 'he' ? 'כל התמונות' : 'All photos'}>
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${index + 1}`}
              className={index === activeIndex ? `${styles.thumb} ${styles.thumbActive}` : styles.thumb}
              onClick={() => goToIndex(index + 1)}
            >
              <img
                src={item.kind === 'photo' ? item.thumbnail : item.poster}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ArrowIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg
      width="18"
      height="14"
      viewBox="0 0 18 14"
      fill="none"
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path d="M1 7H17M17 7L11 1M17 7L11 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
