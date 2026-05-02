'use client'

import { useEffect, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { DETAIL_LAYER_LABELS } from '@/lib/spectrum/detailLayerClassifier'
import type { SpectrumDetailDensity, SpectrumDetailLayerKey } from '@/types/spectrum'

const OPTIONS: Array<{ value: SpectrumDetailDensity; label: string; title: string }> = [
  { value: 'clean', label: 'Clean', title: 'Minimal overview' },
  { value: 'details', label: 'Details', title: 'Balanced POI density' },
  { value: 'max', label: 'Max', title: 'Maximum technical detail' },
]

const PANEL_ITEMS: SpectrumDetailLayerKey[] = [
  'pointsOfInterest',
  'technologies',
  'channels',
  'regulations',
  'hazards',
  'natural',
]

export function DetailDensityToggle() {
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const setDetailDensity = useSpectrumStore(s => s.setDetailDensity)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const toggleDetailLayer = useSpectrumStore(s => s.toggleDetailLayer)
  const [panelOpen, setPanelOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPanelOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])

  return (
    <div
      ref={rootRef}
      className="density-control"
      onContextMenu={event => {
        event.preventDefault()
        setPanelOpen(open => !open)
      }}
    >
      <div className="density-pill" role="group" aria-label="Spectrum detail density" title="Right click: layer panel">
        {OPTIONS.map((option, index) => (
          <button
            key={option.value}
            className={`density-dot-btn ${detailDensity === option.value ? 'active' : ''}`}
            onClick={() => setDetailDensity(option.value)}
            aria-label={option.label}
            aria-pressed={detailDensity === option.value}
            title={`${option.label}: ${option.title}`}
          >
            <span className={`density-dot dot-${index + 1}`} />
          </button>
        ))}
        <span className="density-label" aria-hidden>
          {OPTIONS.find(o => o.value === detailDensity)?.label}
        </span>
      </div>

      {panelOpen && (
        <div className="density-panel" role="menu" aria-label="Detail layer panel">
          <div className="density-panel-title">Detail Layers</div>
          {PANEL_ITEMS.map(item => (
            <button
              key={item}
              className={`density-panel-row ${detailLayers[item] ? 'active' : 'inactive'}`}
              type="button"
              role="menuitemcheckbox"
              aria-checked={detailLayers[item]}
              onClick={() => toggleDetailLayer(item)}
            >
              <span className="density-panel-check" />
              <span>{DETAIL_LAYER_LABELS[item]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
