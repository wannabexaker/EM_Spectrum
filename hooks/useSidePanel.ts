'use client'

import { useSpectrumStore } from '@/store/spectrumStore'

export function useSidePanel() {
  const selectedBand = useSpectrumStore(s => s.selectedBand)
  const isPanelOpen = useSpectrumStore(s => s.isPanelOpen)
  const selectBand = useSpectrumStore(s => s.selectBand)

  const closePanel = () => selectBand(null)

  return { selectedBand, isPanelOpen, closePanel }
}
