'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

const MODE_LABEL: Record<string, string> = {
  educational: 'Educational view',
  professional: 'Professional view',
}

const DENSITY_LABEL: Record<string, string> = {
  clean: 'Clean',
  details: 'Details',
  max: 'Max detail',
}

export function CanvasContextBadge() {
  const activeMode = useSpectrumStore(s => s.activeMode)
  const detailDensity = useSpectrumStore(s => s.detailDensity)

  const parts = [
    MODE_LABEL[activeMode] ?? activeMode,
    DENSITY_LABEL[detailDensity] ?? detailDensity,
    'Logarithmic scale',
  ]

  return (
    <div className="canvas-context-badge" aria-hidden>
      {parts.join(' · ')}
    </div>
  )
}
