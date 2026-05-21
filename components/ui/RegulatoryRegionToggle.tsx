'use client'

import { useSpectrumStore } from '@/store/spectrumStore'
import type { RegulatoryRegion } from '@/types/spectrum'

const REGIONS: Array<{ value: RegulatoryRegion; label: string; title: string }> = [
  { value: 'all', label: 'All', title: 'Show every available legal note' },
  { value: 'eu', label: 'EU', title: 'Prefer EU/CEPT/ETSI legal notes' },
  { value: 'us', label: 'US', title: 'Prefer US/FCC legal notes' },
  { value: 'japan', label: 'JP', title: 'Prefer Japan-specific legal notes' },
]

export function RegulatoryRegionToggle() {
  const regulatoryRegion = useSpectrumStore(s => s.regulatoryRegion)
  const setRegulatoryRegion = useSpectrumStore(s => s.setRegulatoryRegion)

  return (
    <div className="region-toggle" role="group" aria-label="Legal region">
      {REGIONS.map(region => (
        <button
          key={region.value}
          className={`region-btn ${regulatoryRegion === region.value ? 'active' : ''}`}
          onClick={() => setRegulatoryRegion(region.value)}
          aria-pressed={regulatoryRegion === region.value}
          title={region.title}
        >
          {region.label}
        </button>
      ))}
    </div>
  )
}
