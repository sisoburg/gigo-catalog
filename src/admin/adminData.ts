import { supabase } from '../lib/supabase'
import { publicUrl } from '../data/mapRows'
import type { Tables, TablesInsert } from '../lib/database.types'

export type PieceRow = Tables<'pieces'>
export type MediaRow = Tables<'media'>

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
  const { error } = await supabase.storage.from('media').upload(path, body, { contentType })
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
 *  bytes at this same URL. */
export async function updateStorageObject(path: string, body: Blob, contentType: string): Promise<void> {
  const { error: removeError } = await supabase.storage.from('media').remove([path])
  if (removeError) throw removeError
  const { error: uploadError } = await supabase.storage.from('media').upload(path, body, { contentType, cacheControl: '0' })
  if (uploadError) throw uploadError
}

export async function insertMediaRow(row: TablesInsert<'media'>): Promise<MediaRow> {
  const { data, error } = await supabase.from('media').insert(row).select('*').single()
  if (error) throw error
  return data
}

export { publicUrl }
