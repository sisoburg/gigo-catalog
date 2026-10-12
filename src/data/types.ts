export type Locale = 'he' | 'en'

export interface LocalizedText {
  he: string
  en: string
}

export interface PhotoMedia {
  kind: 'photo'
  /** Public Supabase Storage URLs; pick the size that fits the context. */
  thumbnail: string
  medium: string
  large: string
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
  id: string
  slug: string
  name: LocalizedText
  materials: LocalizedText
  description: LocalizedText
  /** Whole currency units (e.g. ILS); absent = not for sale / inquire. */
  price?: number
  cover: PhotoMedia
  gallery: PieceMedia[]
}

export interface HeroMedia {
  kind: 'photo' | 'video'
  src: string
  poster?: string
}
