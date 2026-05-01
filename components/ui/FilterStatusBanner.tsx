'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

export function FilterStatusBanner() {
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const showHazards = useSpectrumStore(s => s.showHazards)

  const hidden = [
    !showEM && 'EM Spectrum',
    !showSound && 'Sound Waves',
    !showApplications && 'Applications',
    !showHazards && 'Hazards',
  ].filter(Boolean) as string[]

  if (hidden.length === 0) return null

  return (
    <div className="filter-status-banner" role="status" aria-live="polite">
      <span className="filter-status-icon">⚠</span>
      Hidden: {hidden.join(' · ')}
    </div>
  )
}
