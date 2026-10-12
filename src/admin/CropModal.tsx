import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { PIECE_ASPECT } from './imagePipeline'

interface CropModalProps {
  imageSrc: string
  onCancel: () => void
  onConfirm: (crop: Area) => void
}

export function CropModal({ imageSrc, onCancel, onConfirm }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedPixels(areaPixels)
  }, [])

  return (
    <div className="cropOverlay">
      <div className="cropArea">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={PIECE_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="cropControls">
        <div className="row">
          <label htmlFor="zoom">Zoom</label>
          <input id="zoom" type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </div>
        <div className="buttons">
          <button className="btn secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" type="button" disabled={!croppedPixels} onClick={() => croppedPixels && onConfirm(croppedPixels)}>
            Use this crop
          </button>
        </div>
      </div>
    </div>
  )
}
