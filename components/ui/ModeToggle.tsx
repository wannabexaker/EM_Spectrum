'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

export function ModeToggle() {
  const activeMode = useSpectrumStore(s => s.activeMode)
  const setMode = useSpectrumStore(s => s.setMode)

  return (
    <div className="mode-toggle" role="group" aria-label="Display mode">
      <button
        className={`mode-btn ${activeMode === 'educational' ? 'active' : ''}`}
        onClick={() => setMode('educational')}
        aria-pressed={activeMode === 'educational'}
        title="Educational mode — plain language"
      >
        Educational
      </button>
      <button
        className={`mode-btn ${activeMode === 'professional' ? 'active' : ''}`}
        onClick={() => setMode('professional')}
        aria-pressed={activeMode === 'professional'}
        title="Professional mode — technical specs"
      >
        Professional
      </button>
    </div>
  )
}
