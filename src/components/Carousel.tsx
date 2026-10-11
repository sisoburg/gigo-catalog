import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Piece } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { PieceCard } from './PieceCard'
import styles from './Carousel.module.css'

interface CarouselProps {
  pieces: Piece[]
}

const DRAG_CLICK_THRESHOLD = 6

export function Carousel({ pieces }: CarouselProps) {
  const { dir } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // --- drag-to-scroll (desktop mouse; touch gets native swipe for free) ---
  // Deliberately NOT using setPointerCapture: capturing the pointer on the
  // track also redirects the subsequent synthetic "click" to the track,
  // which meant it never reached the card's <a> and clicks did nothing.
  // Plain window listeners avoid that while still letting a real drag
  // cancel the click (via the capture-phase listener below).
  const dragState = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null)

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return // let the browser handle touch natively
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
        // Swallow the click that follows a drag so it doesn't navigate.
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
  }, [])

  // --- vertical wheel -> horizontal scroll ---
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // already horizontal, let it be
    track.scrollLeft += e.deltaY
    e.preventDefault()
  }, [])

  // --- arrow keys: always move toward the visually indicated side ---
  const goToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(pieces.length - 1, index))
    const item = track.children[clamped] as HTMLElement | undefined
    item?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [pieces.length])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const visualStep = (visualRight: boolean) => (dir === 'rtl' ? (visualRight ? -1 : 1) : visualRight ? 1 : -1)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToIndex(activeIndex + visualStep(true))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToIndex(activeIndex + visualStep(false))
      }
    },
    [activeIndex, dir, goToIndex],
  )

  // --- track the centered item for the dash indicator ---
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((en) => en.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          const index = Number((visible[0].target as HTMLElement).dataset.carouselItem)
          if (!Number.isNaN(index)) setActiveIndex(index)
        }
      },
      { root: track, threshold: [0.6] },
    )
    Array.from(track.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [pieces])

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
        {pieces.map((piece, index) => (
          <PieceCard key={piece.slug} piece={piece} index={index} />
        ))}
      </div>
      <div className={styles.dashes} aria-hidden="true">
        {pieces.map((_, index) => (
          <span key={index} className={index === activeIndex ? styles.dashActive : styles.dash} />
        ))}
      </div>
    </div>
  )
}
