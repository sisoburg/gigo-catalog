import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Piece } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { PieceCard } from './PieceCard'
import styles from './Carousel.module.css'

gsap.registerPlugin(ScrollTrigger)

interface CarouselProps {
  pieces: Piece[]
}

const DRAG_CLICK_THRESHOLD = 6
const SETTLE_DELAY_MS = 150

type TrackItem = { kind: 'cap' } | { kind: 'piece'; piece: Piece; realIndex: number }

export function Carousel({ pieces }: CarouselProps) {
  const { dir, locale } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const domIndexRef = useRef(0)

  // Loop illusion: a clone of the last piece (plus a cap) sits before the
  // real run, and a clone of the first piece (plus a cap) sits after it.
  // Swiping past either end briefly shows the cap, then the clone — which
  // is visually identical to the real piece it mirrors — at which point
  // we silently snap scrollLeft onto the real one so the next swipe keeps
  // going through the actual list instead of hitting a wall.
  const trackItems = useMemo<TrackItem[]>(() => {
    if (pieces.length === 0) return []
    return [
      { kind: 'piece', piece: pieces[pieces.length - 1], realIndex: pieces.length - 1 },
      { kind: 'cap' },
      ...pieces.map((piece, i) => ({ kind: 'piece' as const, piece, realIndex: i })),
      { kind: 'cap' },
      { kind: 'piece', piece: pieces[0], realIndex: 0 },
    ]
  }, [pieces])

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
  // A native listener, not React's onWheel: React attaches wheel handlers
  // as passive by default, which silently drops preventDefault() and logs
  // a console warning — the page would scroll vertically at the same time.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // already horizontal, let it be
      track.scrollLeft += e.deltaY
      e.preventDefault()
    }
    track.addEventListener('wheel', onWheel, { passive: false })
    return () => track.removeEventListener('wheel', onWheel)
  }, [])

  // --- shared "which way is visually left/right" helper for keys + arrows ---
  const goToIndex = useCallback(
    (index: number, instant = false) => {
      const track = trackRef.current
      if (!track) return
      const clamped = Math.max(0, Math.min(trackItems.length - 1, index))
      const item = track.children[clamped] as HTMLElement | undefined
      if (!item) return
      // Scroll the track itself, not scrollIntoView: that also scrolls the
      // page vertically, which on load jumped the visitor past the hero.
      const left = item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2
      track.scrollTo({ left, behavior: instant ? 'auto' : 'smooth' })
    },
    [trackItems.length],
  )

  // Start centered on the middle piece instead of the first — starting at
  // index 0 left the whole left side of the viewport empty until the visitor
  // scrolled, which read as broken rather than "this is the start." (+2 to
  // skip past the leading clone + cap into the real run.)
  useLayoutEffect(() => {
    goToIndex(Math.floor(pieces.length / 2) + 2, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces.length])

  const visualStep = useCallback(
    (towardVisualRight: boolean) => (dir === 'rtl' ? (towardVisualRight ? -1 : 1) : towardVisualRight ? 1 : -1),
    [dir],
  )

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
      }
    },
    [goVisualLeft, goVisualRight],
  )

  // --- track the centered item, and silently unwrap onto the real piece
  // once a swipe/click settles on one of the loop clones. ---
  // Deliberately NOT IntersectionObserver: at desktop widths several cards
  // are simultaneously >60% visible, and an IO callback only reports
  // entries whose ratio just crossed the threshold — not a full re-scan —
  // so it was reporting whichever card last crossed in (often the one
  // newly scrolled into view), not the actually-centered one. Measuring
  // directly against scrollLeft is unambiguous regardless of how many
  // cards fit on screen at once.
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

      const entry = trackItems[closestIndex]
      if (entry?.kind === 'piece') setActiveIndex(entry.realIndex)

      if (settleTimer) window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        // Settled on the leading clone (of the last piece) -> hop onto the
        // real last piece; settled on the trailing clone (of the first) ->
        // hop onto the real first piece. Same position visually, so the jump
        // is invisible, but it resets the scroll range for the next swipe.
        if (closestIndex === 0) goToIndex(trackItems.length - 3, true)
        else if (closestIndex === trackItems.length - 1) goToIndex(2, true)
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

  // --- staggered entrance as the carousel scrolls into view ---
  // useLayoutEffect so the opacity:0 starting state is set before paint —
  // otherwise there's a one-frame flash of the cards at full opacity.
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const initialDomIndex = Math.floor(pieces.length / 2) + 2
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      gsap.set(track.children, { opacity: 1, y: 0, scale: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        track.children,
        { opacity: 0, y: 36, scale: 0.96 },
        {
          // Animate straight to each card's resting state (active vs. dimmed)
          // so clearing props at the end doesn't produce a visible snap.
          opacity: (i) => (i === initialDomIndex ? 1 : 0.55),
          y: 0,
          scale: (i) => (i === initialDomIndex ? 1 : 0.94),
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.08,
          clearProps: 'transform,opacity', // hand both back to CSS (active-card scale/dim, hover zoom)
          scrollTrigger: { trigger: track, start: 'top 85%', once: true },
        },
      )
    })
    return () => ctx.revert()
  }, [pieces])

  return (
    <div className={styles.wrapper}>
      <div className={styles.viewport}>
        <button
          type="button"
          className={styles.arrowLeft}
          onClick={goVisualLeft}
          aria-label={locale === 'he' ? 'הקודם' : 'Previous'}
        >
          <ArrowIcon flipped />
        </button>
        <div
          ref={trackRef}
          className={styles.track}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
        >
          {trackItems.map((entry, domIndex) =>
            entry.kind === 'cap' ? (
              <div key={`cap-${domIndex}`} className={styles.cap} aria-hidden="true" />
            ) : (
              <PieceCard
                key={`${entry.piece.slug}-${domIndex}`}
                piece={entry.piece}
                index={entry.realIndex}
                active={entry.realIndex === activeIndex}
                onFocusCard={() => goToIndex(domIndex)}
              />
            ),
          )}
        </div>
        <button
          type="button"
          className={styles.arrowRight}
          onClick={goVisualRight}
          aria-label={locale === 'he' ? 'הבא' : 'Next'}
        >
          <ArrowIcon />
        </button>
      </div>
      <div className={styles.dots} aria-hidden="true">
        {pieces.map((_, i) => (
          <span key={i} className={i === activeIndex ? `${styles.dot} ${styles.dotActive}` : styles.dot} />
        ))}
      </div>
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
