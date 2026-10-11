import { useEffect, useState } from 'react'
import styles from './FontPairingSwitcher.module.css'

export type FontPairing = 'a' | 'b' | 'c'

const PAIRINGS: { id: FontPairing; label: string }[] = [
  { id: 'a', label: 'A · Frank Ruhl Libre + Assistant' },
  { id: 'b', label: 'B · David Libre/Cormorant + Heebo' },
  { id: 'c', label: 'C · Heebo everywhere' },
]

/**
 * TEMPORARY Stage-1 review tool — lets us compare the three candidate font
 * pairings live on real piece content. Remove once a pairing is chosen and
 * hardcode it in tokens.css instead.
 */
export function FontPairingSwitcher() {
  const [pairing, setPairing] = useState<FontPairing>('a')

  useEffect(() => {
    document.documentElement.dataset.fontPairing = pairing
  }, [pairing])

  return (
    <div className={styles.switcher}>
      {PAIRINGS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={p.id === pairing ? styles.active : undefined}
          onClick={() => setPairing(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
