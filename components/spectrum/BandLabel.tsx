'use client'

import { useSpectrumStore } from '@/store/spectrumStore'
import { formatFrequency, freqToScreenX } from '@/lib/zoom/logMapper'
import type { SpectrumBand, ZoomState } from '@/types/spectrum'

interface BandLabelProps {
  band: SpectrumBand
  zoomState: ZoomState
  containerWidth: number
}

export function BandLabel({ band, zoomState, containerWidth }: BandLabelProps) {
  const x1 = freqToScreenX(band.frequency_min, containerWidth, zoomState.centerFrequency, zoomState.zoomLevel)
  const x2 = freqToScreenX(band.frequency_max, containerWidth, zoomState.centerFrequency, zoomState.zoomLevel)
  const width = x2 - x1

  if (width < 60) return null

  const cx = x1 + width / 2

  return (
    <div
      className="band-label-overlay"
      style={{ left: `${cx}px`, transform: 'translateX(-50%)' }}
      aria-hidden
    >
      {band.label}
    </div>
  )
}
