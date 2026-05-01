'use client'

import { useEffect, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import type { SpectrumDetailDensity } from '@/types/spectrum'

const OPTIONS: Array<{ value: SpectrumDetailDensity; label: string; title: string }> = [
  { value: 'clean', label: 'Clean', title: 'Minimal overview' },
  { value: 'details', label: 'Details', title: 'Balanced POI density' },
  { value: 'max', label: 'Max', title: 'Maximum technical detail' },
]

const PANEL_ITEMS = [
  'Points of Interest',
  'Technologies',
  'Channels',
  'Regulations',
  'Hazards',
  'Natural/Physics',
]

export function DetailDensityToggle() {
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const setDetailDensity = useSpectrumStore(s => s.setDetailDensity)
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
      <div className="density-pill" role="group" aria-label="Spectrum detail density">
        {OPTIONS.map((option, index) => (
          <button
            key={option.value}
            className={`density-dot-btn ${detailDensity === option.value ? 'active' : ''}`}
            onClick={() => setDetailDensity(option.value)}
            aria-label={option.label}
            aria-pressed={detailDensity === option.value}
            title={`${option.label}: ${option.title}. Right click: layer panel.`}
          >
            <span className={`density-dot dot-${index + 1}`} />
          </button>
        ))}
      </div>

      {panelOpen && (
        <div className="density-panel" role="menu" aria-label="Detail layer panel">
          <div className="density-panel-title">Detail Layers</div>
          {PANEL_ITEMS.map(item => (
            <button key={item} className="density-panel-row" type="button" role="menuitemcheckbox" aria-checked="true">
              <span className="density-panel-check" />
              <span>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
