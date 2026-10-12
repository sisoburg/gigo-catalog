// Carries the clicked carousel card's image rect across the route change so
// the detail page can morph it into place (the signature carousel->detail
// transition). Module-level on purpose: it's transient UI state for a single
// navigation, not app state, so a React context would be overkill.
interface PendingTransition {
  slug: string
  rect: DOMRect
  src: string
}

let pending: PendingTransition | null = null

export function setPendingTransition(data: PendingTransition) {
  pending = data
}

export function consumePendingTransition(slug: string): PendingTransition | null {
  if (pending?.slug === slug) {
    const result = pending
    pending = null
    return result
  }
  return null
}
