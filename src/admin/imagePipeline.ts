// Client-side crop + resize + compress, so uploads are small and consistent
// without needing a server round-trip. Mirrors the sizes scripts/import-to-supabase.ts
// produced server-side: thumbnail/medium/large WebP.

export const PIECE_ASPECT = 4 / 5
export const HERO_ASPECT = 16 / 9
export const HERO_MAX_WIDTH = 2400

export const SIZES = { thumbnail: 480, medium: 900, large: 1600 } as const

export interface CropPixels {
  x: number
  y: number
  width: number
  height: number
}

export function isHeicFile(file: File | Blob): boolean {
  if (file.type) {
    const type = file.type.toLowerCase()
    if (type === 'image/heic' || type === 'image/heif') return true
  }
  if ('name' in file && typeof (file as File).name === 'string') {
    return /\.(heic|heif)$/i.test((file as File).name)
  }
  return false
}

export async function convertHeicToJpeg(file: File | Blob): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })
  return Array.isArray(result) ? result[0] : result
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
  let sourceBlob: Blob = file
  if (isHeicFile(file)) {
    try {
      sourceBlob = await convertHeicToJpeg(file)
    } catch (err) {
      throw new Error(`Failed to convert HEIC image: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(sourceBlob)
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read that image file.'))
    }
    img.src = objectUrl
  })
}

/** Draws the cropped region at its native resolution (capped to maxDim on the
 *  long edge) onto a fresh canvas. */
export function cropToCanvas(image: HTMLImageElement, crop: CropPixels, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(crop.width, crop.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(crop.width * scale)
  canvas.height = Math.round(crop.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function resizeCanvas(source: HTMLCanvasElement, maxWidth: number): HTMLCanvasElement {
  if (source.width <= maxWidth) return source
  const scale = maxWidth / source.width
  const canvas = document.createElement('canvas')
  canvas.width = maxWidth
  canvas.height = Math.round(source.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function canvasToWebp(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/webp', quality)
  })
}

export interface ProcessedPhoto {
  thumbnail: Blob
  medium: Blob
  large: Blob
}

/** The hero is shown full-bleed at any viewport size, so unlike piece photos
 *  it only needs one size — just the crop, capped to HERO_MAX_WIDTH. */
export async function processHeroPhoto(image: HTMLImageElement, crop: CropPixels): Promise<Blob> {
  return canvasToWebp(cropToCanvas(image, crop, HERO_MAX_WIDTH), 0.85)
}

export async function processPhoto(image: HTMLImageElement, crop: CropPixels): Promise<ProcessedPhoto> {
  const largeCanvas = cropToCanvas(image, crop, SIZES.large)
  const [large, medium, thumbnail] = await Promise.all([
    canvasToWebp(largeCanvas, 0.85),
    canvasToWebp(resizeCanvas(largeCanvas, SIZES.medium), 0.82),
    canvasToWebp(resizeCanvas(largeCanvas, SIZES.thumbnail), 0.8),
  ])
  return { thumbnail, medium, large }
}

/** Fetches a URL as a blob and loads it as an <img> via a same-origin blob:
 *  URL — avoids tainting the canvas that a cross-origin <img src> would
 *  cause (Supabase Storage's CORS headers make the fetch() itself work). */
async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not fetch image')
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not decode image'))
      img.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0)
  return canvas
}

function rotateCanvas90(source: HTMLCanvasElement, direction: 'cw' | 'ccw'): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.height
  canvas.height = source.width
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((direction === 'cw' ? 90 : -90) * (Math.PI / 180))
  ctx.drawImage(source, -source.width / 2, -source.height / 2)
  return canvas
}

/** Re-fetches a photo's three already-published sizes, rotates each 90°,
 *  and re-encodes — for fixing a sideways upload after the fact, without
 *  needing the original source file again. */
export async function rotateStoredPhoto(
  urls: { thumbnail: string; medium: string; large: string },
  direction: 'cw' | 'ccw',
): Promise<ProcessedPhoto> {
  const [thumbImg, mediumImg, largeImg] = await Promise.all([
    loadImageFromUrl(urls.thumbnail),
    loadImageFromUrl(urls.medium),
    loadImageFromUrl(urls.large),
  ])
  const [thumbnail, medium, large] = await Promise.all([
    canvasToWebp(rotateCanvas90(imageToCanvas(thumbImg), direction), 0.8),
    canvasToWebp(rotateCanvas90(imageToCanvas(mediumImg), direction), 0.82),
    canvasToWebp(rotateCanvas90(imageToCanvas(largeImg), direction), 0.85),
  ])
  return { thumbnail, medium, large }
}
