// First-party, anonymous page-view logging (see supabase/migrations/20261020_page_views.sql).
// No IP, no cookies: a random per-browser id in localStorage and a per-tab
// session id. Everything here is best-effort and must never break the page.

import { supabase } from './supabase'

const VISITOR_KEY = 'gigo-visitor-id'
const SESSION_KEY = 'gigo-session-id'

function getOrCreateId(storage: Storage, key: string): string {
  let id = storage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    storage.setItem(key, id)
  }
  return id
}

function shouldSkip(): boolean {
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true
  if (navigator.doNotTrack === '1') return true
  if (/bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(navigator.userAgent)) return true
  return false
}

function deviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet'
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile'
  return 'desktop'
}

function browserName(): string {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Edge'
  if (/OPR\/|Opera/.test(ua)) return 'Opera'
  if (/SamsungBrowser/.test(ua)) return 'Samsung'
  if (/Instagram|FBAN|FBAV/.test(ua)) return 'In-app (IG/FB)'
  if (/Firefox|FxiOS/.test(ua)) return 'Firefox'
  if (/Chrome|CriOS/.test(ua)) return 'Chrome'
  if (/Safari/.test(ua)) return 'Safari'
  return 'Other'
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null
    const host = new URL(document.referrer).hostname
    return host === window.location.hostname ? null : host.replace(/^www\./, '')
  } catch {
    return null
  }
}

// The referrer is only meaningful for the first page of a visit; later
// in-app navigations would otherwise all be attributed to the same source.
let firstViewLogged = false

/** `path` is the router path (no base), e.g. "/" or "/piece/some-slug". */
export async function trackPageView(path: string, locale: string): Promise<void> {
  try {
    if (shouldSkip()) return
    // Don't count the owner browsing their own site while signed in.
    const { data } = await supabase.auth.getSession()
    if (data.session) return

    const isFirst = !firstViewLogged
    firstViewLogged = true
    const refHost = isFirst ? referrerHost() : null
    const utm = isFirst ? new URLSearchParams(window.location.search).get('utm_source') : null
    const pieceMatch = path.match(/^\/piece\/([^/]+)/)

    await supabase.from('page_views').insert({
      visitor_id: getOrCreateId(localStorage, VISITOR_KEY),
      session_id: getOrCreateId(sessionStorage, SESSION_KEY),
      path: path.slice(0, 300),
      piece_slug: pieceMatch ? decodeURIComponent(pieceMatch[1]).slice(0, 200) : null,
      referrer_host: refHost,
      source: (utm || refHost)?.slice(0, 200) ?? null,
      locale,
      device: deviceType(),
      browser: browserName(),
      screen_w: Math.round(window.screen.width),
    })
  } catch {
    // Storage blocked, offline, ad blocker… analytics just skips this view.
  }
}
