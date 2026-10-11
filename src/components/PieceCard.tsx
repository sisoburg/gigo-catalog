import { Link } from 'react-router-dom'
import type { Piece } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './PieceCard.module.css'

interface PieceCardProps {
  piece: Piece
  index: number
}

export function PieceCard({ piece, index }: PieceCardProps) {
  const { locale } = useLanguage()
  return (
    <Link
      to={`/piece/${piece.slug}`}
      className={styles.card}
      data-carousel-item={index}
      aria-label={piece.name[locale]}
    >
      <div className={styles.imageWrap}>
        <img
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
