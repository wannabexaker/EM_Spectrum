'use client'

import { useEffect } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { encodeViewportState } from '@/lib/deeplink/urlState'
import type { SpectrumDetailDensity } from '@/types/spectrum'

const OPTIONS: Array<{ value: SpectrumDetailDensity; label: string; title: string }> = [
  { value: 'clean', label: 'Low', title: 'Low detail density' },
  { value: 'details', label: 'Mid', title: 'Balanced detail density' },
  { value: 'max', label: 'High', title: 'Maximum detail density' },
]

export function DetailDensityToggle() {
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const setDetailDensity = useSpectrumStore(s => s.setDetailDensity)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const state = useSpectrumStore.getState()
    encodeViewportState(state.centerFrequency, state.zoomLevel, detailDensity)

    try {
      window.localStorage.setItem('density-pref-v1', detailDensity)
    } catch {
      // Ignore storage failures (privacy mode or restricted environments).
    }
  }, [detailDensity])

  return (
    <div className="density-control">
      <div className="density-pill" role="group" aria-label="Spectrum detail density">
        {OPTIONS.map(option => (
          <button
            key={option.value}
            className={`density-level-btn ${detailDensity === option.value ? 'active' : ''}`}
            onClick={() => setDetailDensity(option.value)}
            aria-label={option.label}
            aria-pressed={detailDensity === option.value}
            title={option.title}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
