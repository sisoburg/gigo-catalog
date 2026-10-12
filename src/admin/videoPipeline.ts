// Videos aren't transcoded client-side (no reliable in-browser video encoder) —
// the brief asks for short clips already, so we just validate and warn, then
// capture a poster frame for the gallery's paused/loading state.

export const VIDEO_MAX_DURATION_SECONDS = 12
export const VIDEO_MAX_SIZE_MB = 20

export interface VideoMeta {
  duration: number
  width: number
  height: number
  sizeMB: number
}

export function loadVideoMeta(file: File): Promise<{ meta: VideoMeta; video: HTMLVideoElement }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => {
      resolve({
        meta: {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          sizeMB: file.size / (1024 * 1024),
        },
        video,
      })
    }
    video.onerror = () => reject(new Error('Could not read that video file.'))
    video.src = URL.createObjectURL(file)
  })
}

export function captureVideoPoster(video: HTMLVideoElement, atSeconds = 0.3): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked)
      reject(new Error('Timed out reading that video (unsupported format?)'))
    }, 8000)
    const onSeeked = () => {
      clearTimeout(timeout)
      video.removeEventListener('seeked', onSeeked)
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture a poster frame'))), 'image/webp', 0.85)
    }
    video.addEventListener('seeked', onSeeked)
    const target = Number.isFinite(video.duration) ? Math.min(atSeconds, Math.max(0, video.duration / 2)) : atSeconds
    video.currentTime = target
  })
}

export function describeVideoWarning(meta: VideoMeta): string | null {
  const issues: string[] = []
  if (meta.duration > VIDEO_MAX_DURATION_SECONDS) {
    issues.push(`${meta.duration.toFixed(1)}s long — aim for 5–10s (max ${VIDEO_MAX_DURATION_SECONDS}s recommended)`)
  }
  if (meta.sizeMB > VIDEO_MAX_SIZE_MB) {
    issues.push(`${meta.sizeMB.toFixed(1)}MB — aim under ${VIDEO_MAX_SIZE_MB}MB so it loads fast on mobile data (hard limit is 50MB)`)
  }
  return issues.length ? issues.join('; ') : null
}
