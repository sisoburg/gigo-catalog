import type { Locale } from '../data/types'

export function formatPrice(price: number | undefined, locale: Locale): string {
  if (price === undefined) return locale === 'he' ? 'לפרטים ומחיר' : 'Inquire for price'
  const formatted = price.toLocaleString(locale === 'he' ? 'he-IL' : 'en-US')
  return `₪${formatted}`
}
