import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mapMediaRow } from './mapRows'
import type { Tables } from '../lib/database.types'
import type { PieceMedia } from './types'

/** Curated WORN filmstrip, set via /admin/worn. `items` is `null` while
 *  loading and `[]` once loaded if nothing's been curated — callers should
 *  fall back to auto-picking photos per piece in that empty case. */
export function useFilmstripItems(): { items: PieceMedia[] | null } {
  const [items, setItems] = useState<PieceMedia[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.from('filmstrip_items').select('media(*)').eq('is_visible', true).order('sort_order')
      if (cancelled) return
      if (error || !data) {
        setItems([])
        return
      }
      const rows = data as unknown as Array<{ media: Tables<'media'> | null }>
      setItems(rows.filter((row) => row.media !== null).map((row) => mapMediaRow(row.media!)))
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { items }
}
