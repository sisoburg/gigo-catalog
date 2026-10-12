import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import type { Piece, PieceMedia, PhotoMedia, HeroMedia } from './types'

export function publicUrl(path: string): string {
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

function mapMediaRow(row: Tables<'media'>): PieceMedia {
  if (row.kind === 'video') {
    return {
      kind: 'video',
      src: publicUrl(row.path_video!),
      poster: publicUrl(row.path_poster!),
      alt: { en: row.alt_en, he: row.alt_he },
    }
  }
  return {
    kind: 'photo',
    thumbnail: publicUrl(row.path_thumbnail!),
    medium: publicUrl(row.path_medium!),
    large: publicUrl(row.path_large!),
    alt: { en: row.alt_en, he: row.alt_he },
  }
}

/** Groups a flat pieces+media query result into the app's Piece[] shape. */
export function mapPieceRows(
  pieceRows: Tables<'pieces'>[],
  mediaRows: Tables<'media'>[],
): Piece[] {
  const mediaByPiece = new Map<string, Tables<'media'>[]>()
  for (const row of mediaRows) {
    const list = mediaByPiece.get(row.piece_id) ?? []
    list.push(row)
    mediaByPiece.set(row.piece_id, list)
  }
  for (const list of mediaByPiece.values()) list.sort((a, b) => a.sort_order - b.sort_order)

  return pieceRows.map((p): Piece => {
    const mediaRowsForPiece = mediaByPiece.get(p.id) ?? []
    const gallery = mediaRowsForPiece.map(mapMediaRow)
    const coverRow = mediaRowsForPiece.find((m) => m.is_cover) ?? mediaRowsForPiece[0]
    const cover: PhotoMedia =
      coverRow && coverRow.kind === 'photo'
        ? (mapMediaRow(coverRow) as PhotoMedia)
        : {
            kind: 'photo',
            thumbnail: '',
            medium: '',
            large: '',
            alt: { en: '', he: '' },
          }
    return {
      id: p.id,
      slug: p.slug,
      name: { en: p.name_en, he: p.name_he },
      materials: { en: p.materials_en, he: p.materials_he },
      description: { en: p.description_en, he: p.description_he },
      price: p.price ?? undefined,
      cover,
      gallery,
    }
  })
}

export function mapHeroRow(row: Tables<'site_settings'> | null): HeroMedia | null {
  if (!row) return null
  if (row.hero_kind === 'video' && row.hero_path_video) {
    return { kind: 'video', src: publicUrl(row.hero_path_video), poster: row.hero_path_poster ? publicUrl(row.hero_path_poster) : undefined }
  }
  if (row.hero_kind === 'photo' && row.hero_path_image) {
    return { kind: 'photo', src: publicUrl(row.hero_path_image) }
  }
  return null
}
