import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Piece } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import { setPendingTransition } from '../transitionStore'
import styles from './PieceCard.module.css'

interface PieceCardProps {
  piece: Piece
  index: number
  active: boolean
}

const LONG_PRESS_MS = 280
const AUTO_CYCLE_MS = 650
const MOVE_CANCEL_THRESHOLD = 8

export function PieceCard({ piece, index, active }: PieceCardProps) {
  const { locale } = useLanguage()
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [peeking, setPeeking] = useState(false)

  const previewPhotos = piece.gallery.filter((m) => m.kind === 'photo').slice(0, 5)
  const canPeek = previewPhotos.length > 1

  const handleClick = () => {
    const img = imgRef.current
    if (!img) return
    setPendingTransition({ slug: piece.slug, rect: img.getBoundingClientRect(), src: piece.cover.src })
  }

  // --- desktop: moving across the image scrubs through the gallery ---
  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!canPeek) return
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      const ratio = Math.min(0.999, Math.max(0, (e.clientX - rect.left) / rect.width))
      setPreviewIndex(Math.floor(ratio * previewPhotos.length))
      setPeeking(true)
    },
    [canPeek, previewPhotos.length],
  )
  const handleMouseLeave = useCallback(() => {
    setPeeking(false)
    setPreviewIndex(0)
  }, [])

  // --- touch: a long press auto-cycles through the gallery ---
  const pressState = useRef<{ startX: number; startY: number; longPressTimer?: number; cycleTimer?: number }>({
    startX: 0,
    startY: 0,
  })

  const stopCycle = useCallback(() => {
    const state = pressState.current
    if (state.longPressTimer) window.clearTimeout(state.longPressTimer)
    if (state.cycleTimer) window.clearInterval(state.cycleTimer)
    state.longPressTimer = undefined
    state.cycleTimer = undefined
    setPeeking(false)
    setPreviewIndex(0)
  }, [])

  const handleTouchStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'touch' || !canPeek) return
      pressState.current.startX = e.clientX
      pressState.current.startY = e.clientY
      pressState.current.longPressTimer = window.setTimeout(() => {
        setPeeking(true)
        let i = 0
        pressState.current.cycleTimer = window.setInterval(() => {
          i = (i + 1) % previewPhotos.length
          setPreviewIndex(i)
        }, AUTO_CYCLE_MS)
      }, LONG_PRESS_MS)
    },
    [canPeek, previewPhotos.length],
  )
  const handleTouchMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return
    const dx = e.clientX - pressState.current.startX
    const dy = e.clientY - pressState.current.startY
    if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD) {
      if (pressState.current.longPressTimer) window.clearTimeout(pressState.current.longPressTimer)
      stopCycle()
    }
  }, [stopCycle])
  const handleTouchEnd = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'touch') return
      if (pressState.current.longPressTimer) window.clearTimeout(pressState.current.longPressTimer)
      stopCycle()
    },
    [stopCycle],
  )

  return (
    <Link
      to={`/piece/${piece.slug}`}
      className={active ? `${styles.card} ${styles.active}` : styles.card}
      data-carousel-item={index}
      aria-label={piece.name[locale]}
      onClick={handleClick}
    >
      <div
        ref={wrapRef}
        className={styles.imageWrap}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handleTouchStart}
        onPointerMove={handleTouchMove}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchEnd}
      >
        {previewPhotos.map((photo, i) => (
          <img
            key={i}
            ref={i === 0 ? imgRef : undefined}
            className={i === previewIndex ? `${styles.image} ${styles.imageShown}` : styles.image}
            src={photo.src}
            alt={i === 0 ? piece.cover.alt[locale] : ''}
            aria-hidden={i === 0 ? undefined : true}
            loading={index < 2 && i === 0 ? 'eager' : 'lazy'}
          />
        ))}
        {canPeek && (
          <div className={peeking ? `${styles.peekDots} ${styles.peekDotsVisible}` : styles.peekDots} aria-hidden="true">
            {previewPhotos.map((_, i) => (
              <span key={i} className={i === previewIndex ? styles.peekDotActive : styles.peekDot} />
            ))}
          </div>
        )}
      </div>
      <div className={styles.caption}>
        <h3 className={styles.name}>{piece.name[locale]}</h3>
        <p className={styles.materials}>{piece.materials[locale]}</p>
      </div>
    </Link>
  )
}
