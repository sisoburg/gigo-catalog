// Tracks which pieces a visitor has opened, purely client-side (localStorage),
// so "Previously viewed" can link back to them without an account or backend.

const KEY = 'gigo-recently-viewed'
const MAX = 8

export function recordView(slug: string): void {
  try {
    const list = readList()
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private browsing / storage blocked — viewing history just won't persist.
  }
}

export function getRecentlyViewed(excludeSlug?: string): string[] {
  return readList().filter((s) => s !== excludeSlug)
}

function readList(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}
