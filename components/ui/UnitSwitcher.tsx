'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

export function UnitSwitcher() {
  const displayUnit = useSpectrumStore(s => s.displayUnit)
  const setDisplayUnit = useSpectrumStore(s => s.setDisplayUnit)

  return (
    <div className="unit-switcher" role="group" aria-label="Display unit">
      <button
        className={`unit-btn ${displayUnit === 'frequency' ? 'active' : ''}`}
        onClick={() => setDisplayUnit('frequency')}
        aria-pressed={displayUnit === 'frequency'}
        title="Show frequency in Hz"
      >
        Hz
      </button>
      <button
        className={`unit-btn ${displayUnit === 'wavelength' ? 'active' : ''}`}
        onClick={() => setDisplayUnit('wavelength')}
        aria-pressed={displayUnit === 'wavelength'}
        title="Show wavelength"
      >
        λ
      </button>
    </div>
  )
}
