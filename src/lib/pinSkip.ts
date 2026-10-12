import { scrollToY } from '../components/SmoothScroll'

/** Jumps a visitor out of a GSAP-pinned section, before or after it. Reads
 *  the live pin-spacer geometry rather than the ScrollTrigger instance's
 *  cached start/end, which goes stale once Lenis's own scroll-driven
 *  recalculation is in the mix. Shared by every pinned/scrubbed section so
 *  none of them trap a visitor who'd rather not scroll through the whole
 *  thing. */
export function skipPinnedSection(sectionEl: HTMLElement | null, direction: 'up' | 'down'): void {
  const spacer = sectionEl?.closest<HTMLElement>('.pin-spacer')
  if (!spacer) return
  const top = spacer.getBoundingClientRect().top + window.scrollY
  const target = direction === 'down' ? top + spacer.offsetHeight + 40 : top - 40
  scrollToY(target)
}
