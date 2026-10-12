import type { Piece } from '../data/types'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { PieceMiniCard } from './PieceMiniCard'
import styles from './PieceRow.module.css'

interface PieceRowProps {
  title: string
  pieces: Piece[]
}

export function PieceRow({ title, pieces }: PieceRowProps) {
  const ref = useScrollReveal<HTMLDivElement>()
  if (pieces.length === 0) return null

  return (
    <section ref={ref} className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.row}>
        {pieces.map((piece) => (
          <PieceMiniCard key={piece.slug} piece={piece} />
        ))}
      </div>
    </section>
  )
}
