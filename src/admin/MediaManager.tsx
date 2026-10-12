import { useCallback, useEffect, useRef, useState } from 'react'
import type { Area } from 'react-easy-crop'
import {
  fetchMediaForPiece,
  reorderMedia,
  setCover,
  deleteMedia,
  uploadToStorage,
  updateStorageObject,
  insertMediaRow,
  publicUrl,
  type MediaRow,
} from './adminData'
import { loadImage, processPhoto, rotateStoredPhoto, type ProcessedPhoto } from './imagePipeline'
import { loadVideoMeta, captureVideoPoster, describeVideoWarning } from './videoPipeline'
import { CropModal } from './CropModal'

interface MediaManagerProps {
  pieceId: string
}

/** The storage path doesn't change on rotate, so append a cache-busting
 *  query param after one to force a fresh fetch instead of showing the
 *  browser's cached (pre-rotate) bytes for the rest of this admin session. */
function thumbSrc(m: MediaRow, bust?: number): string {
  const url = publicUrl(m.path_thumbnail!)
  return bust ? `${url}?v=${bust}` : url
}

export function MediaManager({ pieceId }: MediaManagerProps) {
  const [items, setItems] = useState<MediaRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [rotatingId, setRotatingId] = useState<string | null>(null)
  const [cacheBust, setCacheBust] = useState<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Photo crop flow state
  const [pendingImage, setPendingImage] = useState<{ src: string; img: HTMLImageElement } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [videoWarning, setVideoWarning] = useState<string | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      setItems(await fetchMediaForPiece(pieceId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load media')
    }
  }, [pieceId])

  useEffect(() => {
    load()
  }, [load])

  // --- photo upload: pick file -> crop -> process -> upload ---
  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const img = await loadImage(file)
      setPendingImage({ src: img.src, img })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that image')
    } finally {
      setUploading(false)
    }
  }

  async function handleCropConfirm(crop: Area) {
    if (!pendingImage) return
    setUploading(true)
    setError(null)
    try {
      const processed: ProcessedPhoto = await processPhoto(pendingImage.img, crop)
      const id = crypto.randomUUID()
      const base = `pieces/${pieceId}/${id}`
      const [pThumb, pMedium, pLarge] = await Promise.all([
        uploadToStorage(`${base}-thumb.webp`, processed.thumbnail, 'image/webp'),
        uploadToStorage(`${base}-medium.webp`, processed.medium, 'image/webp'),
        uploadToStorage(`${base}-large.webp`, processed.large, 'image/webp'),
      ])
      const isFirst = (items?.length ?? 0) === 0
      await insertMediaRow({
        id,
        piece_id: pieceId,
        kind: 'photo',
        path_thumbnail: pThumb,
        path_medium: pMedium,
        path_large: pLarge,
        sort_order: items?.length ?? 0,
        is_cover: isFirst,
      })
      URL.revokeObjectURL(pendingImage.src)
      setPendingImage(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    if (pendingImage) URL.revokeObjectURL(pendingImage.src)
    setPendingImage(null)
  }

  // --- video upload: pick file -> validate -> capture poster -> upload ---
  async function handleVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    setVideoWarning(null)
    try {
      const { meta, video } = await loadVideoMeta(file)
      const warning = describeVideoWarning(meta)
      if (warning) setVideoWarning(`This clip is ${warning}. Uploaded anyway, but consider trimming it.`)

      const poster = await captureVideoPoster(video)
      const id = crypto.randomUUID()
      const base = `pieces/${pieceId}/${id}`
      const [pVideo, pPoster] = await Promise.all([
        uploadToStorage(`${base}-video.mp4`, file, file.type || 'video/mp4'),
        uploadToStorage(`${base}-poster.webp`, poster, 'image/webp'),
      ])
      const isFirst = (items?.length ?? 0) === 0
      await insertMediaRow({
        id,
        piece_id: pieceId,
        kind: 'video',
        path_video: pVideo,
        path_poster: pPoster,
        sort_order: items?.length ?? 0,
        is_cover: isFirst,
      })
      URL.revokeObjectURL(video.src)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSetCover(mediaId: string) {
    setItems((prev) => prev && prev.map((m) => ({ ...m, is_cover: m.id === mediaId })))
    try {
      await setCover(pieceId, mediaId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set cover')
      load()
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!confirm('Delete this item?')) return
    try {
      await deleteMedia(mediaId, pieceId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  async function handleRotate(m: MediaRow, direction: 'cw' | 'ccw') {
    if (m.kind !== 'photo' || !m.path_thumbnail || !m.path_medium || !m.path_large) return
    setRotatingId(m.id)
    setError(null)
    try {
      const rotated = await rotateStoredPhoto(
        { thumbnail: publicUrl(m.path_thumbnail), medium: publicUrl(m.path_medium), large: publicUrl(m.path_large) },
        direction,
      )
      await Promise.all([
        updateStorageObject(m.path_thumbnail, rotated.thumbnail, 'image/webp'),
        updateStorageObject(m.path_medium, rotated.medium, 'image/webp'),
        updateStorageObject(m.path_large, rotated.large, 'image/webp'),
      ])
      // The storage path doesn't change, so bust the browser's own cache of
      // it for this session — otherwise the old (sideways) bytes keep showing.
      setCacheBust((prev) => ({ ...prev, [m.id]: Date.now() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rotate failed')
    } finally {
      setRotatingId(null)
    }
  }

  // --- drag reorder across the grid ---
  const onGripPointerDown = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.preventDefault()
      setDraggingId(id)

      const onMove = (ev: PointerEvent) => {
        const container = containerRef.current
        if (!container) return
        const els = Array.from(container.querySelectorAll<HTMLElement>('[data-media-id]'))
        let closestIndex = 0
        let closestDistance = Infinity
        els.forEach((el, i) => {
          const rect = el.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const distance = Math.hypot(ev.clientX - cx, ev.clientY - cy)
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = i
          }
        })
        setItems((prev) => {
          if (!prev) return prev
          const fromIndex = prev.findIndex((m) => m.id === id)
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
          if (prev) reorderMedia(prev.map((m) => m.id)).catch((e) => setError(e instanceof Error ? e.message : 'Reorder failed'))
          return prev
        })
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [],
  )

  return (
    <div>
      {error && <div className="alert error">{error}</div>}
      {videoWarning && <div className="alert info">{videoWarning}</div>}

      {!items ? (
        <span className="spinner" />
      ) : (
        <div className="mediaGrid" ref={containerRef}>
          {items.map((m) => (
            <div key={m.id} data-media-id={m.id} className={draggingId === m.id ? 'mediaItem dragging' : 'mediaItem'}>
              {m.kind === 'photo' ? (
                <img src={thumbSrc(m, cacheBust[m.id])} alt="" />
              ) : (
                <video src={publicUrl(m.path_video!)} poster={m.path_poster ? publicUrl(m.path_poster) : undefined} muted />
              )}
              {rotatingId === m.id && (
                <div className="mediaBusy">
                  <span className="spinner" />
                </div>
              )}
              <div className="mediaActions">
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  {m.is_cover ? <span className="coverBadge">COVER</span> : <span />}
                  <span
                    className="grip"
                    onPointerDown={onGripPointerDown(m.id)}
                    style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 4, padding: '0 0.3rem', color: '#000' }}
                  >
                    ⠿
                  </span>
                </div>
                <div className="mediaButtons">
                  {m.kind === 'photo' && (
                    <>
                      <button type="button" disabled={rotatingId === m.id} onClick={() => handleRotate(m, 'ccw')} title="Rotate left">
                        ⟲
                      </button>
                      <button type="button" disabled={rotatingId === m.id} onClick={() => handleRotate(m, 'cw')} title="Rotate right">
                        ⟳
                      </button>
                    </>
                  )}
                  {!m.is_cover && (
                    <button type="button" onClick={() => handleSetCover(m.id)}>
                      Set cover
                    </button>
                  )}
                  <button type="button" onClick={() => handleDeleteMedia(m.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <button className="btn secondary small" type="button" disabled={uploading} onClick={() => photoInputRef.current?.click()}>
          {uploading ? <span className="spinner" /> : '+ Add photo'}
        </button>
        <button className="btn secondary small" type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()}>
          {uploading ? <span className="spinner" /> : '+ Add video'}
        </button>
        <input ref={photoInputRef} type="file" accept="image/*,.heic,.heif,image/heic,image/heif" hidden onChange={handlePhotoPick} />
        <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoPick} />
      </div>
      <p className="helpText">Photos are cropped to a 4:5 frame and resized to three sizes automatically. Videos should be short, 5–10s clips.</p>

      {pendingImage && <CropModal imageSrc={pendingImage.src} onCancel={handleCropCancel} onConfirm={handleCropConfirm} />}
    </div>
  )
}
