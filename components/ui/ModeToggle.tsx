'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

const MODE_CONFIG = {
  educational: {
    label: 'Educational',
    tooltip: 'Plain-language band descriptions and common-name markers',
  },
  professional: {
    label: 'Professional',
    tooltip: 'ITU sub-band designations (ELF→EHF), technology overlays (GPS L1, 5G mmWave…) and live band readout',
  },
} as const

export function ModeToggle() {
  const activeMode = useSpectrumStore(s => s.activeMode)
  const setMode = useSpectrumStore(s => s.setMode)

  return (
    <div className="mode-toggle" role="group" aria-label="Display mode">
      {(Object.keys(MODE_CONFIG) as Array<keyof typeof MODE_CONFIG>).map(mode => (
        <button
          key={mode}
          className={`mode-btn ${activeMode === mode ? 'active' : ''}`}
          onClick={() => setMode(mode)}
          aria-pressed={activeMode === mode}
          title={MODE_CONFIG[mode].tooltip}
        >
          {MODE_CONFIG[mode].label}
        </button>
      ))}
    </div>
  )
}
