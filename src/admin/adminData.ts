import { supabase } from '../lib/supabase'
import { publicUrl } from '../data/mapRows'
import type { Tables, TablesInsert } from '../lib/database.types'

export type PieceRow = Tables<'pieces'>
export type MediaRow = Tables<'media'>
export type FilmstripItemRow = Tables<'filmstrip_items'>
export type HeroCandidateRow = Tables<'hero_candidates'>

export interface FilmstripItemWithMedia extends FilmstripItemRow {
  media: Pick<MediaRow, 'id' | 'kind' | 'path_thumbnail' | 'path_poster'> & { piece_name: string }
}

export interface BrowsableMedia extends Pick<MediaRow, 'id' | 'kind' | 'path_thumbnail' | 'path_poster' | 'piece_id'> {
  piece_name: string
}

export async function fetchAllPieces(): Promise<PieceRow[]> {
  const { data, error } = await supabase.from('pieces').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function fetchCoverThumbs(pieceIds: string[]): Promise<Map<string, string>> {
  if (pieceIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('media')
    .select('piece_id, path_thumbnail')
    .in('piece_id', pieceIds)
    .eq('is_cover', true)
  if (error) throw error
  const map = new Map<string, string>()
  for (const row of data) {
    if (row.path_thumbnail) map.set(row.piece_id, publicUrl(row.path_thumbnail))
  }
  return map
}

export async function fetchPiece(id: string): Promise<PieceRow | null> {
  const { data, error } = await supabase.from('pieces').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchMediaForPiece(pieceId: string): Promise<MediaRow[]> {
  const { data, error } = await supabase.from('media').select('*').eq('piece_id', pieceId).order('sort_order')
  if (error) throw error
  return data
}

export async function createPiece(input: Partial<TablesInsert<'pieces'>>): Promise<PieceRow> {
  const { data: existing } = await supabase.from('pieces').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1
  // "slug" has a unique constraint, and a brand-new piece has no name yet —
  // always fall back to a timestamp-based slug, never a fixed literal like
  // "piece" (clicking "+ New piece" twice without typing a name would then
  // collide on the second one).
  const base = (input.slug || input.name_en || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const slug = base || `piece-${Date.now()}`
  const { data, error } = await supabase
    .from('pieces')
    .insert({
      slug,
      name_en: '',
      name_he: '',
      materials_en: '',
      materials_he: '',
      description_en: '',
      description_he: '',
      is_draft: true,
      sort_order: nextOrder,
      ...input,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePiece(id: string, patch: Partial<PieceRow>): Promise<void> {
  const { error } = await supabase.from('pieces').update(patch).eq('id', id)
  if (error) throw error
}

export async function deletePiece(id: string): Promise<void> {
  // Storage objects for this piece are orphaned on delete (acceptable for
  // admin-triggered deletes of a small personal catalog); the DB rows cascade.
  const { error } = await supabase.from('pieces').delete().eq('id', id)
  if (error) throw error
}

export async function reorderPieces(orderedIds: string[]): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => supabase.from('pieces').update({ sort_order: index }).eq('id', id)))
}

export async function reorderMedia(orderedIds: string[]): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => supabase.from('media').update({ sort_order: index }).eq('id', id)))
}

export async function setCover(pieceId: string, mediaId: string): Promise<void> {
  // The DB has a partial unique index (one cover per piece), so clear first.
  const { error: clearError } = await supabase.from('media').update({ is_cover: false }).eq('piece_id', pieceId)
  if (clearError) throw clearError
  const { error } = await supabase.from('media').update({ is_cover: true }).eq('id', mediaId)
  if (error) throw error
}

export async function deleteMedia(id: string, pieceId: string): Promise<void> {
  const wasCover = await supabase.from('media').select('is_cover').eq('id', id).single()
  const { error } = await supabase.from('media').delete().eq('id', id)
  if (error) throw error
  if (wasCover.data?.is_cover) {
    const { data: remaining } = await supabase.from('media').select('id').eq('piece_id', pieceId).order('sort_order').limit(1)
    if (remaining?.[0]) await setCover(pieceId, remaining[0].id)
  }
}

export async function uploadToStorage(path: string, body: Blob, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from('media').upload(path, body, { contentType, cacheControl: '31536000' })
  if (error) throw error
  return path
}

/** Overwrites an existing object at the same path (e.g. fixing a sideways
 *  photo in place). Confirmed in production: `.update()` hits the same
 *  broken "new row violates row-level security policy" authorization path
 *  as `.upload({upsert:true})` did during the original import — so this
 *  removes the old object and does a plain `.upload()` instead, the one
 *  combination actually proven to work under this project's RLS policies.
 *  cacheControl:'0' asks Storage not to let CDNs/browsers cache the old
 *  bytes at this same URL.
 *
 *  The remove and the upload each succeed individually but Storage's
 *  delete isn't immediately visible to a following upload (confirmed in
 *  production: "The resource already exists" right after a clean remove),
 *  so the upload retries a few times with a short delay instead of only
 *  trying once. */
export async function updateStorageObject(path: string, body: Blob, contentType: string): Promise<void> {
  const { error: removeError } = await supabase.storage.from('media').remove([path])
  if (removeError) throw removeError

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 400))
    const { error: uploadError } = await supabase.storage.from('media').upload(path, body, { contentType, cacheControl: '0' })
    if (!uploadError) return
    lastError = uploadError
    if (!uploadError.message.toLowerCase().includes('already exists')) throw uploadError
  }
  throw lastError
}

export async function insertMediaRow(row: TablesInsert<'media'>): Promise<MediaRow> {
  const { data, error } = await supabase.from('media').insert(row).select('*').single()
  if (error) throw error
  return data
}

// --- WORN filmstrip curation ---

export async function fetchFilmstripItems(): Promise<FilmstripItemWithMedia[]> {
  const { data, error } = await supabase
    .from('filmstrip_items')
    .select('*, media(id, kind, path_thumbnail, path_poster, pieces(name_en))')
    .order('sort_order')
  if (error) throw error
  return (data as unknown as Array<FilmstripItemRow & { media: MediaRow & { pieces: { name_en: string } } }>).map((row) => ({
    ...row,
    media: {
      id: row.media.id,
      kind: row.media.kind,
      path_thumbnail: row.media.path_thumbnail,
      path_poster: row.media.path_poster,
      piece_name: row.media.pieces?.name_en ?? '',
    },
  }))
}

/** Every photo/video across every piece (including drafts), for the "add to
 *  WORN" browser — curating ahead of publishing a piece is fine, since the
 *  public read policy still hides it until that piece goes live. */
export async function fetchAllMediaForBrowsing(): Promise<BrowsableMedia[]> {
  const { data, error } = await supabase
    .from('media')
    .select('id, kind, path_thumbnail, path_poster, piece_id, pieces(name_en, sort_order)')
    .order('sort_order')
  if (error) throw error
  return (data as unknown as Array<MediaRow & { pieces: { name_en: string; sort_order: number } }>)
    .sort((a, b) => (a.pieces?.sort_order ?? 0) - (b.pieces?.sort_order ?? 0))
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      path_thumbnail: row.path_thumbnail,
      path_poster: row.path_poster,
      piece_id: row.piece_id,
      piece_name: row.pieces?.name_en ?? '',
    }))
}

export async function addFilmstripItem(mediaId: string, size: string, layer: string, isVisible = true): Promise<void> {
  const { data: existing } = await supabase.from('filmstrip_items').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1
  const { error } = await supabase.from('filmstrip_items').insert({ media_id: mediaId, size, layer, sort_order: nextOrder, is_visible: isVisible })
  if (error) throw error
}

export async function removeFilmstripItem(id: string): Promise<void> {
  const { error } = await supabase.from('filmstrip_items').delete().eq('id', id)
  if (error) throw error
}

export async function updateFilmstripItem(id: string, patch: { size?: string; layer?: string; is_visible?: boolean }): Promise<void> {
  const { error } = await supabase.from('filmstrip_items').update(patch).eq('id', id)
  if (error) throw error
}

export async function reorderFilmstripItems(orderedIds: string[]): Promise<void> {
  await Promise.all(orderedIds.map((id, index) => supabase.from('filmstrip_items').update({ sort_order: index }).eq('id', id)))
}

// --- Homepage hero candidates ---

export async function fetchHeroCandidates(): Promise<HeroCandidateRow[]> {
  const { data, error } = await supabase.from('hero_candidates').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertHeroCandidate(path: string): Promise<HeroCandidateRow> {
  const { data, error } = await supabase.from('hero_candidates').insert({ path }).select('*').single()
  if (error) throw error
  return data
}

export async function deleteHeroCandidate(id: string): Promise<void> {
  const { error } = await supabase.from('hero_candidates').delete().eq('id', id)
  if (error) throw error
}

export { publicUrl }
