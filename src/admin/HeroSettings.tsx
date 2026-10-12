import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { publicUrl, uploadToStorage } from './adminData'
import { loadImage, resizeCanvas, canvasToWebp } from './imagePipeline'
import { loadVideoMeta, captureVideoPoster, describeVideoWarning } from './videoPipeline'
import type { Tables } from '../lib/database.types'

const HERO_MAX_WIDTH = 2400

export function HeroSettings() {
  const [settings, setSettings] = useState<Tables<'site_settings'> | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
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
  }, [])

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const img = await loadImage(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.drawImage(img, 0, 0)
      const resized = resizeCanvas(canvas, HERO_MAX_WIDTH)
      const blob = await canvasToWebp(resized, 0.85)
      const path = `site/hero-${Date.now()}.webp`
      await uploadToStorage(path, blob, 'image/webp')
      const { error } = await supabase
        .from('site_settings')
        .update({ hero_kind: 'photo', hero_path_image: path, hero_path_video: null, hero_path_poster: null })
        .eq('id', true)
      if (error) throw error
      setSettings((s) => (s ? { ...s, hero_kind: 'photo', hero_path_image: path, hero_path_video: null, hero_path_poster: null } : s))
      URL.revokeObjectURL(img.src)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
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
      const w = describeVideoWarning(meta)
      if (w) setWarning(`This clip is ${w}. Uploaded anyway, but consider trimming it.`)
      const poster = await captureVideoPoster(video)
      const stamp = Date.now()
      const videoPath = `site/hero-${stamp}.mp4`
      const posterPath = `site/hero-${stamp}-poster.webp`
      await Promise.all([
        uploadToStorage(videoPath, file, file.type || 'video/mp4'),
        uploadToStorage(posterPath, poster, 'image/webp'),
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
    </div>
  )
}
