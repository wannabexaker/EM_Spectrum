'use client'

import { useEffect, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { PROFESSIONAL_SUB_BANDS, PROFESSIONAL_TECH_OVERLAYS } from '@/data/professionalSpectrum'
import {
  DETAIL_LAYER_LABELS,
  classifyFeature,
  isFeatureVisibleInMode,
} from '@/lib/spectrum/detailLayerClassifier'
import type { SpectrumDetailLayerKey } from '@/types/spectrum'

const LAYER_ORDER: SpectrumDetailLayerKey[] = [
  'pointsOfInterest',
  'technologies',
  'channels',
  'regulations',
  'hazards',
  'natural',
]

/** How many professional-visible features each layer would show, so switching a layer
 *  off tells you what you are giving up. Computed once — the dataset is static. */
const LAYER_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {}
  for (const feature of frequencyFeatures) {
    if (!isFeatureVisibleInMode(feature, 'professional')) continue
    for (const layer of classifyFeature(feature)) {
      counts[layer] = (counts[layer] ?? 0) + 1
    }
  }
  return counts
})()

/**
 * Layer filter for professional mode — the counterpart to EduAtlasFilter, which only
 * exists in educational mode. Professional mode had no filter of its own: the detail
 * layers were reachable only as a side effect of the density presets, so users could not
 * ask for "channels but not hazards".
 */
export function ProLayerFilter() {
  const activeMode = useSpectrumStore(s => s.activeMode)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const toggleDetailLayer = useSpectrumStore(s => s.toggleDetailLayer)
  const resetDetailLayers = useSpectrumStore(s => s.resetDetailLayers)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (activeMode !== 'professional') return null

  const hiddenCount = LAYER_ORDER.filter(layer => !detailLayers[layer]).length

  return (
    <div className="edu-filter" ref={ref}>
      <button
        className={`edu-filter-trigger ${hiddenCount ? 'has-active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Filter which professional detail layers are drawn"
      >
        Layers
        {hiddenCount > 0 && <span className="edu-filter-count">{hiddenCount}</span>}
      </button>

      {open && (
        <div className="edu-filter-panel" role="group" aria-label="Professional layer filters">
          <div className="edu-filter-row">
            <span className="edu-filter-title">Detail layers</span>
            {hiddenCount > 0 && (
              <button className="edu-filter-reset" onClick={resetDetailLayers}>Reset</button>
            )}
          </div>

          <div className="edu-filter-domains">
            {LAYER_ORDER.map(layer => {
              const on = detailLayers[layer]
              return (
                <button
                  key={layer}
                  className={`edu-filter-chip ${on ? 'on' : 'off'}`}
                  onClick={() => toggleDetailLayer(layer)}
                  aria-pressed={on}
                >
                  {DETAIL_LAYER_LABELS[layer]}
                  <span className="edu-filter-chip-count">{LAYER_COUNTS[layer] ?? 0}</span>
                </button>
              )
            })}
          </div>

          <div className="edu-filter-legend">
            <span className="edu-filter-title">Always drawn</span>
            <div className="edu-filter-legend-row">
              <span className="edu-filter-legend-label">ITU sub-bands</span>
              <span className="edu-filter-legend-count">{PROFESSIONAL_SUB_BANDS.length}</span>
            </div>
            <div className="edu-filter-legend-row">
              <span className="edu-filter-legend-label">Technology allocations</span>
              <span className="edu-filter-legend-count">{PROFESSIONAL_TECH_OVERLAYS.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
