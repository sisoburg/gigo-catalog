import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchAllPieces,
  fetchCoverThumbs,
  updatePiece,
  deletePiece,
  reorderPieces,
  createPiece,
  type PieceRow,
} from './adminData'

interface Row {
  piece: PieceRow
  coverUrl: string | null
}

export function PieceList() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const pieces = await fetchAllPieces()
      const thumbs = await fetchCoverThumbs(pieces.map((p) => p.id))
      setRows(pieces.map((piece) => ({ piece, coverUrl: thumbs.get(piece.id) ?? null })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pieces')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggleDraft(row: Row) {
    const next = !row.piece.is_draft
    setRows((prev) => prev && prev.map((r) => (r.piece.id === row.piece.id ? { ...r, piece: { ...r.piece, is_draft: next } } : r)))
    try {
      await updatePiece(row.piece.id, { is_draft: next })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
      load()
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Delete "${row.piece.name_en || row.piece.slug}"? This can't be undone.`)) return
    try {
      await deletePiece(row.piece.id)
      setRows((prev) => prev && prev.filter((r) => r.piece.id !== row.piece.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  // --- drag reorder (pointer-based; works for mouse + touch) ---
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
        setRows((prev) => {
          if (!prev) return prev
          const fromIndex = prev.findIndex((r) => r.piece.id === id)
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
        setRows((prev) => {
          if (prev) reorderPieces(prev.map((r) => r.piece.id)).catch((e) => setError(e instanceof Error ? e.message : 'Reorder failed'))
          return prev
        })
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [],
  )

  async function handleCreate() {
    try {
      const piece = await createPiece({})
      navigate(`piece/${piece.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create piece')
    }
  }

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ fontSize: '1rem' }}>Pieces</h2>
        <button className="btn" type="button" onClick={handleCreate}>
          + New piece
        </button>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!rows ? (
        <span className="spinner" />
      ) : rows.length === 0 ? (
        <p className="helpText">No pieces yet. Add your first one above.</p>
      ) : (
        <div ref={containerRef}>
          {rows.map((row) => (
            <div key={row.piece.id} data-row-id={row.piece.id} className={draggingId === row.piece.id ? 'pieceRow dragging' : 'pieceRow'}>
              <span className="grip" onPointerDown={onGripPointerDown(row.piece.id)} title="Drag to reorder">
                ⠿
              </span>
              {row.coverUrl ? <img className="thumb" src={row.coverUrl} alt="" /> : <div className="thumb" />}
              <div className="info">
                <div className="name">
                  {row.piece.name_en || <em style={{ color: 'var(--a-muted)' }}>Untitled</em>}
                  {row.piece.name_he ? ` · ${row.piece.name_he}` : ''}
                </div>
                <div className="meta">
                  <span className={row.piece.is_draft ? 'badge draft' : 'badge live'}>{row.piece.is_draft ? 'Draft' : 'Live'}</span>
                  {' · '}
                  {row.piece.materials_en || 'No materials yet'}
                </div>
              </div>
              <div className="actions">
                <label className="toggle" title="Published on the public site">
                  <input type="checkbox" checked={!row.piece.is_draft} onChange={() => handleToggleDraft(row)} />
                </label>
                <Link className="btn secondary small" to={`piece/${row.piece.id}`}>
                  Edit
                </Link>
                <button className="btn danger small" type="button" onClick={() => handleDelete(row)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
