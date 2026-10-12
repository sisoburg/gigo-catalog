import { Link } from 'react-router-dom'
import type { Piece } from '../data/types'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './PieceMiniCard.module.css'

interface PieceMiniCardProps {
  piece: Piece
}

export function PieceMiniCard({ piece }: PieceMiniCardProps) {
  const { locale } = useLanguage()
  return (
    <Link to={`/piece/${piece.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={piece.cover.medium} alt={piece.cover.alt[locale]} loading="lazy" />
      </div>
      <h3 className={styles.name}>{piece.name[locale]}</h3>
    </Link>
  )
}
