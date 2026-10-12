import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchPiece, updatePiece, deletePiece, type PieceRow } from './adminData'
import { MediaManager } from './MediaManager'

export function PieceEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [piece, setPiece] = useState<PieceRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchPiece(id)
      .then((p) => setPiece(p))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load piece'))
  }, [id])

  const field = useCallback(
    (key: keyof PieceRow) => ({
      value: (piece?.[key] as string) ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setPiece((p) => (p ? { ...p, [key]: e.target.value } : p)),
    }),
    [piece],
  )

  async function handleSave() {
    if (!piece || !id) return
    setSaving(true)
    setError(null)
    try {
      await updatePiece(id, {
        slug: piece.slug,
        name_en: piece.name_en,
        name_he: piece.name_he,
        materials_en: piece.materials_en,
        materials_he: piece.materials_he,
        description_en: piece.description_en,
        description_he: piece.description_he,
        price: piece.price,
        is_draft: piece.is_draft,
      })
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id || !piece) return
    if (!confirm(`Delete "${piece.name_en || piece.slug}"? This can't be undone.`)) return
    try {
      await deletePiece(id)
      navigate('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  if (error && !piece) return <div className="alert error">{error}</div>
  if (!piece) return <span className="spinner" />

  return (
    <div>
      <div className="toolbar">
        <Link to="/admin" className="helpText">
          ← All pieces
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label className="toggle">
            <input type="checkbox" checked={!piece.is_draft} onChange={(e) => setPiece({ ...piece, is_draft: !e.target.checked })} />
            Live on site
          </label>
          <button className="btn danger small" type="button" onClick={handleDelete}>
            Delete piece
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {showSaved && <div className="alert info">Saved.</div>}

      <div className="card">
        <div className="field">
          <label htmlFor="slug">URL slug</label>
          <input id="slug" type="text" {...field('slug')} />
          <span className="helpText">Used in the piece's link. Letters, numbers, dashes only.</span>
        </div>

        <div className="fieldRow">
          <div className="field">
            <label htmlFor="name_en">Name (English)</label>
            <input id="name_en" type="text" {...field('name_en')} />
          </div>
          <div className="field">
            <label htmlFor="name_he">שם (עברית)</label>
            <input id="name_he" type="text" dir="rtl" {...field('name_he')} />
          </div>
        </div>

        <div className="fieldRow">
          <div className="field">
            <label htmlFor="materials_en">Materials (English)</label>
            <input id="materials_en" type="text" {...field('materials_en')} />
          </div>
          <div className="field">
            <label htmlFor="materials_he">חומרים (עברית)</label>
            <input id="materials_he" type="text" dir="rtl" {...field('materials_he')} />
          </div>
        </div>

        <div className="fieldRow">
          <div className="field">
            <label htmlFor="description_en">Description (English)</label>
            <textarea id="description_en" {...field('description_en')} />
          </div>
          <div className="field">
            <label htmlFor="description_he">תיאור (עברית)</label>
            <textarea id="description_he" dir="rtl" {...field('description_he')} />
          </div>
        </div>

        <div className="field" style={{ maxWidth: 200 }}>
          <label htmlFor="price">Price (optional)</label>
          <input
            id="price"
            type="number"
            value={piece.price ?? ''}
            onChange={(e) => setPiece({ ...piece, price: e.target.value === '' ? null : Number(e.target.value) })}
          />
          <span className="helpText">Leave blank for "inquire."</span>
        </div>

        <button className="btn" type="button" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save'}
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Photos &amp; video</h3>
        <MediaManager pieceId={piece.id} />
      </div>
    </div>
  )
}
