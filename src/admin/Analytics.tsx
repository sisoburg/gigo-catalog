import { useEffect, useMemo, useState } from 'react'
import {
  fetchRecent,
  fetchSeries,
  fetchSummary,
  fetchTop,
  type Bucket,
  type Dimension,
  type PageViewRow,
  type SeriesPoint,
  type Summary,
  type TopRow,
} from './analyticsData'

type RangeKey = '7d' | '30d' | '90d' | '12m' | 'all'

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: '12m', label: '12 months', days: 365 },
  { key: 'all', label: 'All time', days: null },
]
const BUCKETS: { key: Bucket; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]
const TOPS: { dim: Dimension; title: string }[] = [
  { dim: 'piece', title: 'Top pieces' },
  { dim: 'source', title: 'Where from' },
  { dim: 'device', title: 'Devices' },
  { dim: 'locale', title: 'Language' },
]

const DAY = 86_400_000

interface Data {
  summary: Summary
  previous: Summary | null
  series: SeriesPoint[]
  tops: Record<Dimension, TopRow[]>
  recent: PageViewRow[]
}

export function Analytics() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [bucket, setBucket] = useState<Bucket>('day')
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const now = new Date()
    const to = new Date(now.getTime() + 60_000)
    const days = RANGES.find((r) => r.key === range)?.days ?? null
    const from = days ? new Date(now.getTime() - days * DAY) : new Date(0)
    const prevFrom = days ? new Date(from.getTime() - days * DAY) : null

    Promise.all([
      fetchSummary(from, to),
      prevFrom ? fetchSummary(prevFrom, from) : Promise.resolve(null),
      fetchSeries(from, to, bucket),
      Promise.all(TOPS.map((t) => fetchTop(from, to, t.dim))),
      fetchRecent(from, to),
    ])
      .then(([summary, previous, series, tops, recent]) => {
        if (cancelled) return
        const topMap = {} as Record<Dimension, TopRow[]>
        TOPS.forEach((t, i) => (topMap[t.dim] = tops[i]))
        setData({ summary, previous, series, tops: topMap, recent })
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [range, bucket])

  return (
    <div>
      <div className="anaControls">
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Analytics</h2>
        <div className="anaSegments">
          <Segmented options={RANGES} value={range} onChange={setRange} />
          <Segmented options={BUCKETS} value={bucket} onChange={setBucket} prefix="Group by" />
        </div>
      </div>

      {error && <p style={{ color: 'var(--a-danger)' }}>{error}</p>}
      {!data && loading && <span className="spinner" style={{ borderColor: 'rgba(0,0,0,.2)', borderTopColor: 'var(--a-fg)' }} />}

      {data && (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
          <Kpis summary={data.summary} previous={data.previous} />

          <div className="card anaCard">
            <h3>Views &amp; visitors per {bucket}</h3>
            <Chart points={data.series} bucket={bucket} />
          </div>

          <div className="anaGrid">
            {TOPS.map((t) => (
              <div className="card anaCard" key={t.dim}>
                <h3>{t.title}</h3>
                <Bars rows={data.tops[t.dim]} />
              </div>
            ))}
          </div>

          <div className="card anaCard">
            <h3>Recent visits</h3>
            <Recent rows={data.recent} />
          </div>
          <p className="helpText">
            Visitors are anonymous browsers (a random ID kept in the browser), not people — the same person on two
            devices counts twice. Your own visits are excluded when you&apos;re signed in. Times shown in your local time.
          </p>
        </div>
      )}
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  prefix,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (k: T) => void
  prefix?: string
}) {
  return (
    <div className="anaSeg">
      {prefix && <span className="helpText" style={{ margin: 0 }}>{prefix}</span>}
      {options.map((o) => (
        <button key={o.key} type="button" className={o.key === value ? 'on' : undefined} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Kpis({ summary, previous }: { summary: Summary; previous: Summary | null }) {
  const returningPct = summary.unique_visitors ? Math.round((summary.returning_visitors / summary.unique_visitors) * 100) : 0
  const pagesPerSession = summary.sessions ? (summary.total_views / summary.sessions).toFixed(1) : '0'
  const cards = [
    { label: 'Page views', value: summary.total_views.toLocaleString(), now: summary.total_views, prev: previous?.total_views },
    { label: 'Unique visitors', value: summary.unique_visitors.toLocaleString(), now: summary.unique_visitors, prev: previous?.unique_visitors },
    { label: 'Sessions', value: summary.sessions.toLocaleString(), now: summary.sessions, prev: previous?.sessions },
    { label: 'Returning visitors', value: `${returningPct}%`, sub: `${summary.returning_visitors} of ${summary.unique_visitors}` },
    { label: 'Pages / session', value: pagesPerSession },
  ]
  return (
    <div className="anaKpis">
      {cards.map((c) => (
        <div className="card anaCard" key={c.label}>
          <div className="anaKpiLabel">{c.label}</div>
          <div className="anaKpiValue">{c.value}</div>
          <div className="helpText" style={{ margin: 0 }}>
            {c.prev !== undefined && c.now !== undefined ? <Delta now={c.now} prev={c.prev} /> : (c.sub ?? ' ')}
          </div>
        </div>
      ))}
    </div>
  )
}

function Delta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) return <>{now > 0 ? 'new vs previous period' : ' '}</>
  const pct = Math.round(((now - prev) / prev) * 100)
  const color = pct > 0 ? 'var(--a-ok)' : pct < 0 ? 'var(--a-danger)' : 'var(--a-muted)'
  return (
    <span style={{ color }}>
      {pct > 0 ? '▲' : pct < 0 ? '▼' : '–'} {Math.abs(pct)}% <span style={{ color: 'var(--a-muted)' }}>vs previous period</span>
    </span>
  )
}

function bucketLabel(iso: string, bucket: Bucket): string {
  const d = new Date(iso + 'T00:00:00')
  if (bucket === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Chart({ points, bucket }: { points: SeriesPoint[]; bucket: Bucket }) {
  const max = useMemo(() => Math.max(1, ...points.map((p) => p.views)), [points])
  if (points.length === 0) return <p className="helpText">No visits in this period yet.</p>

  const W = Math.max(points.length * 22, 320)
  const H = 180
  const pad = { t: 8, b: 22, l: 0, r: 0 }
  const innerH = H - pad.t - pad.b
  const slot = W / points.length
  const barW = Math.min(slot * 0.7, 28)
  const labelEvery = Math.ceil(points.length / 10)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', maxWidth: '100%', minWidth: 320 }} role="img" aria-label="Views over time">
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={pad.t + innerH * (1 - f)} y2={pad.t + innerH * (1 - f)} stroke="var(--a-line)" strokeDasharray="3 3" />
        ))}
        {points.map((p, i) => {
          const x = i * slot + (slot - barW) / 2
          const hViews = (p.views / max) * innerH
          const hVis = (p.visitors / max) * innerH
          return (
            <g key={p.bucket}>
              <title>{`${bucketLabel(p.bucket, bucket)}: ${p.views} views, ${p.visitors} visitors`}</title>
              <rect x={x} y={pad.t + innerH - hViews} width={barW} height={Math.max(hViews, 1)} fill="var(--a-line)" rx={2} />
              <rect x={x} y={pad.t + innerH - hVis} width={barW} height={Math.max(hVis, 1)} fill="var(--a-accent)" rx={2} />
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--a-muted)">
                  {bucketLabel(p.bucket, bucket)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="helpText" style={{ display: 'flex', gap: '1rem' }}>
        <span><i className="anaDot" style={{ background: 'var(--a-line)' }} /> Views (peak {max})</span>
        <span><i className="anaDot" style={{ background: 'var(--a-accent)' }} /> Unique visitors</span>
      </div>
    </div>
  )
}

function Bars({ rows }: { rows: TopRow[] }) {
  if (rows.length === 0) return <p className="helpText">Nothing yet.</p>
  const max = Math.max(...rows.map((r) => r.views))
  return (
    <div className="anaBars">
      {rows.map((r) => (
        <div key={r.label} className="anaBarRow">
          <div className="anaBarFill" style={{ width: `${(r.views / max) * 100}%` }} />
          <span className="anaBarLabel">{r.label}</span>
          <span className="anaBarNum">{r.views}</span>
        </div>
      ))}
    </div>
  )
}

function Recent({ rows }: { rows: PageViewRow[] }) {
  if (rows.length === 0) return <p className="helpText">No visits in this period yet.</p>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="anaTable">
        <thead>
          <tr>
            <th>When</th>
            <th>Page</th>
            <th>From</th>
            <th>Device</th>
            <th>Browser</th>
            <th>Lang</th>
            <th>Visitor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              <td>{r.path}</td>
              <td>{r.source ?? 'direct'}</td>
              <td>{r.device}</td>
              <td>{r.browser}</td>
              <td>{r.locale}</td>
              <td title={r.visitor_id}>{r.visitor_id.slice(0, 6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
