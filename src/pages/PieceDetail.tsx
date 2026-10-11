import { Link, useParams } from 'react-router-dom'
import { mockPieces } from '../data/mockPieces'
import { useLanguage } from '../i18n/LanguageContext'
import styles from './PieceDetail.module.css'

// Stage 2 builds the real detail view + the signature carousel->detail
// transition. This stub just proves the routing and deep-linking work.
export function PieceDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { locale } = useLanguage()
  const piece = mockPieces.find((p) => p.slug === slug)

  if (!piece) {
    return (
      <main className={styles.main}>
        <p>{locale === 'he' ? 'הפריט לא נמצא' : 'Piece not found'}</p>
        <Link to="/">{locale === 'he' ? 'חזרה' : 'Back'}</Link>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <img className={styles.image} src={piece.cover.src} alt={piece.cover.alt[locale]} />
      <h1 className={styles.name}>{piece.name[locale]}</h1>
      <p className={styles.materials}>{piece.materials[locale]}</p>
      <p className={styles.description}>{piece.description[locale]}</p>
      <Link to="/" className={styles.back}>
        {locale === 'he' ? '← חזרה לאוסף' : '← Back to collection'}
      </Link>
    </main>
  )
}
