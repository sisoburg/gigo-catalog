import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { mapPieceRows, mapHeroRow } from './mapRows'
import type { Piece, HeroMedia } from './types'

interface CatalogContextValue {
  pieces: Piece[]
  hero: HeroMedia | null
  loading: boolean
  error: string | null
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogContextValue>({
    pieces: [],
    hero: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [piecesRes, mediaRes, settingsRes] = await Promise.all([
        supabase.from('pieces').select('*').eq('is_draft', false).order('sort_order'),
        supabase.from('media').select('*'),
        supabase.from('site_settings').select('*').eq('id', true).single(),
      ])

      if (cancelled) return

      const firstError = piecesRes.error || mediaRes.error || settingsRes.error
      if (firstError) {
        setState({ pieces: [], hero: null, loading: false, error: firstError.message })
        return
      }

      const pieces = mapPieceRows(piecesRes.data ?? [], mediaRes.data ?? [])
      const hero = mapHeroRow(settingsRes.data ?? null)
      setState({ pieces, hero, loading: false, error: null })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider')
  return ctx
}
