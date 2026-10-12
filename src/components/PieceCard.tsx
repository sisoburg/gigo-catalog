import { useRef } from 'react'
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

export function PieceCard({ piece, index, active }: PieceCardProps) {
  const { locale } = useLanguage()
  const imgRef = useRef<HTMLImageElement>(null)

  const handleClick = () => {
    const img = imgRef.current
    if (!img) return
    setPendingTransition({ slug: piece.slug, rect: img.getBoundingClientRect(), src: piece.cover.src })
  }

  return (
    <Link
      to={`/piece/${piece.slug}`}
      className={active ? `${styles.card} ${styles.active}` : styles.card}
      data-carousel-item={index}
      aria-label={piece.name[locale]}
      onClick={handleClick}
    >
      <div className={styles.imageWrap}>
        <img
          ref={imgRef}
          className={styles.image}
          src={piece.cover.src}
          alt={piece.cover.alt[locale]}
          loading={index < 2 ? 'eager' : 'lazy'}
        />
      </div>
      <div className={styles.caption}>
        <h3 className={styles.name}>{piece.name[locale]}</h3>
        <p className={styles.materials}>{piece.materials[locale]}</p>
      </div>
    </Link>
  )
}
