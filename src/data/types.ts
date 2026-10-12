export type Locale = 'he' | 'en'

export interface LocalizedText {
  he: string
  en: string
}

export interface PhotoMedia {
  kind: 'photo'
  /** Statically imported image URL for the hardcoded Stage 1/2 data. */
  src: string
  alt: LocalizedText
}

export interface VideoMedia {
  kind: 'video'
  src: string
  poster: string
  alt: LocalizedText
}

export type PieceMedia = PhotoMedia | VideoMedia

export interface Piece {
  slug: string
  name: LocalizedText
  materials: LocalizedText
  description: LocalizedText
  /** In agorot/cents-free whole currency units; absent = not for sale / inquire. */
  price?: number
  /** True content below is placeholder, pending real copy via /admin. */
  isMock: boolean
  cover: PhotoMedia
  gallery: PieceMedia[]
}
