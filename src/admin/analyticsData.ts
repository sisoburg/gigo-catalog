import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

export type Bucket = 'day' | 'week' | 'month'
export type Dimension = 'piece' | 'source' | 'device' | 'locale' | 'browser'
export type PageViewRow = Tables<'page_views'>

export interface Summary {
  total_views: number
  unique_visitors: number
  sessions: number
  returning_visitors: number
}
export interface SeriesPoint {
  bucket: string
  views: number
  visitors: number
}
export interface TopRow {
  label: string
  views: number
  visitors: number
}

export async function fetchSummary(from: Date, to: Date): Promise<Summary> {
  const { data, error } = await supabase.rpc('analytics_summary', { p_from: from.toISOString(), p_to: to.toISOString() })
  if (error) throw error
  return data[0] ?? { total_views: 0, unique_visitors: 0, sessions: 0, returning_visitors: 0 }
}

export async function fetchSeries(from: Date, to: Date, bucket: Bucket): Promise<SeriesPoint[]> {
  const { data, error } = await supabase.rpc('analytics_timeseries', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_bucket: bucket,
  })
  if (error) throw error
  return data
}

export async function fetchTop(from: Date, to: Date, dimension: Dimension, limit = 8): Promise<TopRow[]> {
  const { data, error } = await supabase.rpc('analytics_top', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_dimension: dimension,
    p_limit: limit,
  })
  if (error) throw error
  return data
}

export async function fetchRecent(from: Date, to: Date, limit = 50): Promise<PageViewRow[]> {
  const { data, error } = await supabase
    .from('page_views')
    .select('*')
    .gte('created_at', from.toISOString())
    .lt('created_at', to.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
