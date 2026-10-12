import type { RefObject } from 'react'
import { skipPinnedSection } from '../lib/pinSkip'
import styles from './PinSkipControls.module.css'

interface PinSkipControlsProps {
  sectionRef: RefObject<HTMLElement | null>
  upLabel: string
  downLabel: string
}

/** Up/down buttons that jump a visitor out of a pinned, scroll-scrubbed
 *  section — every such section gets these so none of them can trap
 *  someone who'd rather not scroll through the whole thing. */
export function PinSkipControls({ sectionRef, upLabel, downLabel }: PinSkipControlsProps) {
  return (
    <div className={styles.skipControls}>
      <button type="button" className={styles.skipButton} onClick={() => skipPinnedSection(sectionRef.current, 'up')} aria-label={upLabel}>
        <SkipIcon />
      </button>
      <button type="button" className={styles.skipButton} onClick={() => skipPinnedSection(sectionRef.current, 'down')} aria-label={downLabel}>
        <SkipIcon flipped />
      </button>
    </div>
  )
}

function SkipIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" style={flipped ? { transform: 'scaleY(-1)' } : undefined} aria-hidden="true">
      <path d="M7 17V1M7 1L1 7M7 1L13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
