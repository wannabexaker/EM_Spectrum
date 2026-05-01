'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

interface LayerDef {
  key: 'EM' | 'sound' | 'applications' | 'hazards'
  label: string
  color: string
  tooltip: string
}

const LAYERS: LayerDef[] = [
  {
    key: 'EM',
    label: 'EM Spectrum',
    color: '#00d4ff',
    tooltip: 'Show/hide electromagnetic band tracks',
  },
  {
    key: 'sound',
    label: 'Sound Waves',
    color: '#ffd60a',
    tooltip: 'Show/hide acoustic frequency overlay',
  },
  {
    key: 'applications',
    label: 'Applications',
    color: '#00ff88',
    tooltip: 'Show/hide technology markers (WiFi, GPS, 5G, NFC…)',
  },
  {
    key: 'hazards',
    label: 'Hazards',
    color: '#ff4444',
    tooltip: 'Show/hide ionizing radiation warning indicators',
  },
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
      {LAYERS.map(layer => {
        const active = isActive(layer.key)
        return (
          <button
            key={layer.key}
            className={`layer-btn ${active ? 'active' : 'inactive'}`}
            style={{ '--layer-color': layer.color } as React.CSSProperties}
            onClick={() => toggleLayer(layer.key)}
            aria-pressed={active}
            aria-label={`${active ? 'Hide' : 'Show'} ${layer.label}`}
            title={layer.tooltip}
          >
            <span className="layer-dot" />
            {layer.label}
            {!active && <span className="layer-off-mark" aria-hidden="true">✕</span>}
          </button>
        )
      })}
    </div>
  )
}
