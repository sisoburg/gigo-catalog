import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchFilmstripItems,
  fetchAllMediaForBrowsing,
  addFilmstripItem,
  removeFilmstripItem,
  reorderFilmstripItems,
  publicUrl,
  type FilmstripItemWithMedia,
  type BrowsableMedia,
} from './adminData'


export function WornSettings() {
  const [items, setItems] = useState<FilmstripItemWithMedia[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [browserOpen, setBrowserOpen] = useState(false)
  const [browseMedia, setBrowseMedia] = useState<BrowsableMedia[] | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      setItems(await fetchFilmstripItems())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function openBrowser() {
    setBrowserOpen(true)
    if (!browseMedia) {
      try {
        setBrowseMedia(await fetchAllMediaForBrowsing())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load media')
      }
    }
  }

  async function handleAdd(mediaId: string) {
    setAddingId(mediaId)
    try {
      await addFilmstripItem(mediaId, 'tall', 'base') // size/layer are unused now; the site styles each image itself
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add')
    } finally {
      setAddingId(null)
    }
  }

  async function handleRemove(id: string) {
    setItems((prev) => prev && prev.filter((i) => i.id !== id))
    try {
      await removeFilmstripItem(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove')
      load()
    }
  }

  // --- drag reorder (same pointer-based pattern as the piece list) ---
  const onGripPointerDown = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.preventDefault()
      setDraggingId(id)

      const onMove = (ev: PointerEvent) => {
        const container = containerRef.current
        if (!container) return
        const rowEls = Array.from(container.querySelectorAll<HTMLElement>('[data-row-id]'))
        let closestIndex = 0
        let closestDistance = Infinity
        rowEls.forEach((el, i) => {
          const rect = el.getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const distance = Math.abs(ev.clientY - midY)
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = i
          }
        })
        setItems((prev) => {
          if (!prev) return prev
          const fromIndex = prev.findIndex((r) => r.id === id)
          if (fromIndex === -1 || fromIndex === closestIndex) return prev
          const next = prev.slice()
          const [moved] = next.splice(fromIndex, 1)
          next.splice(closestIndex, 0, moved)
          return next
        })
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        setDraggingId(null)
        setItems((prev) => {
          if (prev) reorderFilmstripItems(prev.map((r) => r.id)).catch((e) => setError(e instanceof Error ? e.message : 'Reorder failed'))
          return prev
        })
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [],
  )

  const selectedMediaIds = new Set((items ?? []).map((i) => i.media_id))

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '1rem' }}>WORN section</h2>
        <button className="btn" type="button" onClick={openBrowser}>
          + Add media
        </button>
      </div>
      <p className="helpText">
        Pick the images for the homepage "WORN" scroll — about 8–10 of your best shots (photos or videos), in the order you want. The site decides how each one looks and moves. Drag to reorder. Leave this empty to let the site auto-pick.
      </p>

      {error && <div className="alert error">{error}</div>}

      {!items ? (
        <span className="spinner" />
      ) : items.length === 0 ? (
        <p className="helpText">No curated items yet — the site is auto-picking photos per piece.</p>
      ) : (
        <div ref={containerRef}>
          {items.map((item) => (
            <div key={item.id} data-row-id={item.id} className={draggingId === item.id ? 'pieceRow dragging' : 'pieceRow'}>
              <span className="grip" onPointerDown={onGripPointerDown(item.id)} title="Drag to reorder">
                ⠿
              </span>
              {item.media.kind === 'photo' ? (
                item.media.path_thumbnail ? (
                  <img className="thumb" src={publicUrl(item.media.path_thumbnail)} alt="" />
                ) : (
                  <div className="thumb" />
                )
              ) : item.media.path_poster ? (
                <img className="thumb" src={publicUrl(item.media.path_poster)} alt="" />
              ) : (
                <div className="thumb" />
              )}
              <div className="info">
                <div className="name">{item.media.piece_name || 'Untitled'}</div>
                <div className="meta">{item.media.kind === 'video' ? 'Video' : 'Photo'}</div>
              </div>
              <div className="actions" style={{ flexWrap: 'wrap' }}>
                <button className="btn danger small" type="button" onClick={() => handleRemove(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {browserOpen && (
        <div className="cropOverlay">
          <div style={{ padding: '0.75rem 1rem', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>Add to WORN</span>
            <button className="btn secondary small" type="button" onClick={() => setBrowserOpen(false)} style={{ color: '#fff', borderColor: '#555' }}>
              Close
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--a-bg)' }}>
            {!browseMedia ? (
              <span className="spinner" />
            ) : (
              <div className="mediaGrid">
                {browseMedia.map((m) => {
                  const already = selectedMediaIds.has(m.id)
                  const thumb = m.kind === 'photo' ? m.path_thumbnail : m.path_poster
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="mediaItem"
                      disabled={already || addingId === m.id}
                      onClick={() => handleAdd(m.id)}
                      style={{ cursor: already ? 'default' : 'pointer', border: 'none', padding: 0, opacity: already ? 0.4 : 1 }}
                      title={already ? 'Already in WORN' : `Add ${m.piece_name}`}
                    >
                      {thumb ? <img src={publicUrl(thumb)} alt="" /> : <div style={{ width: '100%', height: '100%' }} />}
                      <div className="mediaActions">
                        <span />
                        {already ? (
                          <span className="coverBadge">ADDED</span>
                        ) : addingId === m.id ? (
                          <span className="coverBadge">
                            <span className="spinner" style={{ borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} />
                          </span>
                        ) : (
                          <span className="coverBadge">{m.piece_name || 'Untitled'}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
