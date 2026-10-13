import type { Locale } from '../data/types'

export const strings = {
  siteName: { en: 'Gigo', he: 'גיגו' },
  tagline: { en: 'A private collection', he: 'קולקציה פרטית' },
  viewPiece: { en: 'View', he: 'צפייה' },
} satisfies Record<string, Record<Locale, string>>

export function t(key: keyof typeof strings, locale: Locale): string {
  return strings[key][locale]
}
