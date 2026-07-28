'use client'

import { useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'

interface LayerDef {
  key: 'EM' | 'sound' | 'applications' | 'hazards'
  label: string
  /** Shown instead of `label` on phones, where the full name does not fit but a bare
   *  coloured dot leaves you guessing what the button does. */
  shortLabel: string
  color: string
  tooltip: string
}

const LAYERS: LayerDef[] = [
  {
    key: 'EM',
    label: 'EM Spectrum',
    shortLabel: 'EM',
    color: '#00d4ff',
    tooltip: 'Show/hide electromagnetic band tracks',
  },
  {
    key: 'sound',
    label: 'Sound Waves',
    shortLabel: 'Sound',
    color: '#ffd60a',
    tooltip: 'Show/hide acoustic frequency overlay',
  },
  {
    key: 'applications',
    label: 'Applications',
    shortLabel: 'Apps',
    color: '#00ff88',
    tooltip: 'Show/hide technology markers',
  },
  {
    key: 'hazards',
    label: 'Hazards',
    shortLabel: 'Risk',
    color: '#ff4444',
    tooltip: 'Show/hide ionizing radiation indicators',
  },
]

export function LayerToggle() {
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const showHazards = useSpectrumStore(s => s.showHazards)
  const toggleLayer = useSpectrumStore(s => s.toggleLayer)
  const [toast, setToast] = useState<{ key: LayerDef['key']; text: string } | null>(null)
  const toastTimer = useRef<number | null>(null)

  const isActive = (key: LayerDef['key']) => {
    if (key === 'EM') return showEM
    if (key === 'sound') return showSound
    if (key === 'applications') return showApplications
    if (key === 'hazards') return showHazards
    return false
  }

  const showToast = (key: LayerDef['key'], text: string) => {
    setToast({ key, text })
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1000)
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
            onClick={() => {
              toggleLayer(layer.key)
              showToast(layer.key, active ? 'Hidden' : 'Shown')
            }}
            aria-pressed={active}
            aria-label={`${active ? 'Hide' : 'Show'} ${layer.label}`}
            title={layer.tooltip}
          >
            <span className="layer-dot" />
            <span className="layer-label">{layer.label}</span>
            <span className="layer-label-short" aria-hidden>{layer.shortLabel}</span>
            {!active && <span className="layer-off-mark" aria-hidden="true">x</span>}
            {toast?.key === layer.key && (
              <span className="layer-toast" role="status">
                {toast.text}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
