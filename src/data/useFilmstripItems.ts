import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mapMediaRow } from './mapRows'
import type { Tables } from '../lib/database.types'
import type { FilmstripItem } from '../components/BrandFilmstrip'

/** Curated WORN filmstrip, set via /admin/worn. `items` is `null` while
 *  loading and `[]` once loaded if nothing's been curated — callers should
 *  fall back to auto-picking photos per piece in that empty case. */
export function useFilmstripItems(): { items: FilmstripItem[] | null } {
  const [items, setItems] = useState<FilmstripItem[] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.from('filmstrip_items').select('size, layer, media(*)').order('sort_order')
      if (cancelled) return
      if (error || !data) {
        setItems([])
        return
      }
      const rows = data as unknown as Array<{ size: string; layer: string; media: Tables<'media'> | null }>
      const mapped: FilmstripItem[] = rows
        .filter((row) => row.media !== null)
        .map((row) => ({
          media: mapMediaRow(row.media!),
          size: (row.size as FilmstripItem['size']) ?? 'tall',
          layer: (row.layer as FilmstripItem['layer']) ?? 'base',
        }))
      setItems(mapped)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { items }
}
