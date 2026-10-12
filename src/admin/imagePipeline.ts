// Client-side crop + resize + compress, so uploads are small and consistent
// without needing a server round-trip. Mirrors the sizes scripts/import-to-supabase.ts
// produced server-side: thumbnail/medium/large WebP.

export const PIECE_ASPECT = 4 / 5

export const SIZES = { thumbnail: 480, medium: 900, large: 1600 } as const

export interface CropPixels {
  x: number
  y: number
  width: number
  height: number
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image file.'))
    img.src = URL.createObjectURL(file)
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

export async function processPhoto(image: HTMLImageElement, crop: CropPixels): Promise<ProcessedPhoto> {
  const largeCanvas = cropToCanvas(image, crop, SIZES.large)
  const [large, medium, thumbnail] = await Promise.all([
    canvasToWebp(largeCanvas, 0.85),
    canvasToWebp(resizeCanvas(largeCanvas, SIZES.medium), 0.82),
    canvasToWebp(resizeCanvas(largeCanvas, SIZES.thumbnail), 0.8),
  ])
  return { thumbnail, medium, large }
}
