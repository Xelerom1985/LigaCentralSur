import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

// Recorta la región elegida y la devuelve como JPEG (data URL), redimensionada a ~900px de ancho
async function recortar(imageSrc, cropPixels) {
  const img = await new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = imageSrc
  })
  const maxW = 900
  const scale = Math.min(1, maxW / cropPixels.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cropPixels.width * scale)
  canvas.height = Math.round(cropPixels.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, canvas.width, canvas.height
  )
  return canvas.toDataURL('image/jpeg', 0.72)
}

export default function CropModal({ image, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const onCropComplete = useCallback((_, areaPixels) => setCropPixels(areaPixels), [])

  const confirmar = async () => {
    if (!cropPixels) return
    setGuardando(true)
    const recortada = await recortar(image, cropPixels)
    onConfirm(recortada)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          minZoom={1}
          maxZoom={4}
          restrictPosition={true}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="bg-[#1a1a1a] border-t border-green-900/30 px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex-shrink-0">Zoom</span>
          <input type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-green-500" />
        </div>
        <p className="text-[11px] text-gray-500 text-center">Arrastrá la foto para elegir qué parte se muestra. Zoom al mínimo = se ve más completa.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 bg-[#111] text-gray-400 rounded-xl py-2.5 text-sm border border-green-900/20">
            Cancelar
          </button>
          <button onClick={confirmar} disabled={guardando || !cropPixels}
            className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">
            {guardando ? 'Recortando...' : 'Usar esta foto'}
          </button>
        </div>
      </div>
    </div>
  )
}
