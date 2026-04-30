'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

interface LayerDef {
  key: 'EM' | 'sound' | 'applications' | 'hazards'
  label: string
  color: string
}

const LAYERS: LayerDef[] = [
  { key: 'EM',           label: 'EM Spectrum',  color: '#00d4ff' },
  { key: 'sound',        label: 'Sound Waves',  color: '#ffd60a' },
  { key: 'applications', label: 'Applications', color: '#00ff88' },
  { key: 'hazards',      label: 'Hazards',      color: '#ff4444' },
]

export function LayerToggle() {
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const showHazards = useSpectrumStore(s => s.showHazards)
  const toggleLayer = useSpectrumStore(s => s.toggleLayer)

  const isActive = (key: LayerDef['key']) => {
    if (key === 'EM') return showEM
    if (key === 'sound') return showSound
    if (key === 'applications') return showApplications
    if (key === 'hazards') return showHazards
    return false
  }

  return (
    <div className="layer-toggle-group" role="group" aria-label="Layer toggles">
      {LAYERS.map(layer => (
        <button
          key={layer.key}
          className={`layer-btn ${isActive(layer.key) ? 'active' : ''}`}
          style={{ '--layer-color': layer.color } as React.CSSProperties}
          onClick={() => toggleLayer(layer.key)}
          aria-pressed={isActive(layer.key)}
          aria-label={`Toggle ${layer.label}`}
        >
          <span className="layer-dot" />
          {layer.label}
        </button>
      ))}
    </div>
  )
}
