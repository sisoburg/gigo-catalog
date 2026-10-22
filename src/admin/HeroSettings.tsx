import { useEffect, useRef, useState } from 'react'
import type { Area } from 'react-easy-crop'
import { supabase } from '../lib/supabase'
import {
  publicUrl,
  uploadToStorage,
  fetchHeroCandidates,
  insertHeroCandidate,
  deleteHeroCandidate,
  type HeroCandidateRow,
} from './adminData'
import { loadImage, processHeroPhoto, blobContentType, blobExt, HERO_ASPECT } from './imagePipeline'
import { loadVideoMeta, captureVideoPoster, describeVideoWarning, HERO_VIDEO_MAX_SIZE_MB } from './videoPipeline'
import { CropModal } from './CropModal'
import type { Tables } from '../lib/database.types'

export function HeroSettings() {
  const [settings, setSettings] = useState<Tables<'site_settings'> | null>(null)
  const [candidates, setCandidates] = useState<HeroCandidateRow[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<{ src: string; img: HTMLImageElement } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .eq('id', true)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSettings(data)
      })
    fetchHeroCandidates()
      .then(setCandidates)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load hero photos'))
  }, [])

  // --- photo upload: pick file -> crop -> process -> store as a candidate ---
  // Uploading never immediately replaces the live hero (unless none is set
  // yet) — it just adds another option to the gallery below, so you can try
  // a few before picking a winner with "Set as active".
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
      const blob = await processHeroPhoto(pendingImage.img, crop)
      const path = `site/hero-${Date.now()}.${blobExt(blob)}`
      await uploadToStorage(path, blob, blobContentType(blob))
      const row = await insertHeroCandidate(path)
      setCandidates((prev) => [row, ...(prev ?? [])])
      URL.revokeObjectURL(pendingImage.src)
      setPendingImage(null)
      if (settings && settings.hero_kind !== 'video' && !settings.hero_path_image) {
        await handleSetActivePhoto(path)
      }
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

  async function handleSetActivePhoto(path: string) {
    setError(null)
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ hero_kind: 'photo', hero_path_image: path, hero_path_video: null, hero_path_poster: null })
        .eq('id', true)
      if (error) throw error
      setSettings((s) => (s ? { ...s, hero_kind: 'photo', hero_path_image: path, hero_path_video: null, hero_path_poster: null } : s))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set active hero')
    }
  }

  async function handleDeleteCandidate(candidate: HeroCandidateRow) {
    if (!confirm('Delete this photo?')) return
    setError(null)
    const wasActive = settings?.hero_kind === 'photo' && settings?.hero_path_image === candidate.path
    const fallback = candidates?.find((c) => c.id !== candidate.id)
    try {
      await deleteHeroCandidate(candidate.id)
      setCandidates((prev) => prev && prev.filter((c) => c.id !== candidate.id))
      if (wasActive) {
        if (fallback) {
          await handleSetActivePhoto(fallback.path)
        } else {
          const { error } = await supabase.from('site_settings').update({ hero_path_image: null }).eq('id', true)
          if (error) throw error
          setSettings((s) => (s ? { ...s, hero_path_image: null } : s))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function handleVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    setWarning(null)
    try {
      const { meta, video } = await loadVideoMeta(file)
      if (meta.sizeMB > HERO_VIDEO_MAX_SIZE_MB) {
        throw new Error(
          `The hero video is ${meta.sizeMB.toFixed(1)}MB. It loads for every visitor, so keep it under ${HERO_VIDEO_MAX_SIZE_MB}MB (no audio, H.264).`,
        )
      }
      const w = describeVideoWarning(meta)
      if (w) setWarning(`This clip is ${w}. Uploaded anyway, but consider trimming it.`)
      const poster = await captureVideoPoster(video)
      const stamp = Date.now()
      const videoPath = `site/hero-${stamp}.mp4`
      const posterPath = `site/hero-${stamp}-poster.${blobExt(poster)}`
      await Promise.all([
        uploadToStorage(videoPath, file, file.type || 'video/mp4'),
        uploadToStorage(posterPath, poster, blobContentType(poster)),
      ])
      const { error } = await supabase
        .from('site_settings')
        .update({ hero_kind: 'video', hero_path_video: videoPath, hero_path_poster: posterPath, hero_path_image: null })
        .eq('id', true)
      if (error) throw error
      setSettings((s) => (s ? { ...s, hero_kind: 'video', hero_path_video: videoPath, hero_path_poster: posterPath, hero_path_image: null } : s))
      URL.revokeObjectURL(video.src)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!settings) return <span className="spinner" />

  const currentSrc =
    settings.hero_kind === 'video' && settings.hero_path_video
      ? publicUrl(settings.hero_path_video)
      : settings.hero_path_image
        ? publicUrl(settings.hero_path_image)
        : null

  return (
    <div>
      <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Homepage hero</h2>
      {error && <div className="alert error">{error}</div>}
      {warning && <div className="alert info">{warning}</div>}

      <div className="card">
        <div style={{ aspectRatio: '16/9', background: '#eee', borderRadius: 6, overflow: 'hidden', marginBottom: '1rem', maxWidth: 480 }}>
          {currentSrc ? (
            settings.hero_kind === 'video' ? (
              <video src={currentSrc} poster={settings.hero_path_poster ? publicUrl(settings.hero_path_poster) : undefined} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={currentSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--a-muted)' }}>
              No hero set yet
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn secondary small" type="button" disabled={uploading} onClick={() => photoInputRef.current?.click()}>
            {uploading ? <span className="spinner" /> : 'Upload photo'}
          </button>
          <button className="btn secondary small" type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()}>
            {uploading ? <span className="spinner" /> : 'Upload video'}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={handlePhotoPick} />
          <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideoPick} />
        </div>
        <p className="helpText">A video replaces the photo (and vice versa) — the homepage shows whichever you set most recently.</p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Hero photo options</h3>
        <p className="helpText">Upload a few and compare — "Set as active" swaps the live hero immediately, so you can flip between them until one feels right.</p>
        {!candidates ? (
          <span className="spinner" />
        ) : candidates.length === 0 ? (
          <p className="helpText">No photos uploaded yet.</p>
        ) : (
          <div className="mediaGrid">
            {candidates.map((c) => {
              const active = settings.hero_kind === 'photo' && settings.hero_path_image === c.path
              return (
                <div key={c.id} className={active ? 'mediaItem heroItem active' : 'mediaItem heroItem'}>
                  <img src={publicUrl(c.path)} alt="" />
                  <div className="mediaActions">
                    {active ? <span className="coverBadge">ACTIVE</span> : <span />}
                    <div className="mediaButtons">
                      {!active && (
                        <button type="button" onClick={() => handleSetActivePhoto(c.path)}>
                          Set as active
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteCandidate(c)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {pendingImage && <CropModal imageSrc={pendingImage.src} aspect={HERO_ASPECT} onCancel={handleCropCancel} onConfirm={handleCropConfirm} />}
    </div>
  )
}
