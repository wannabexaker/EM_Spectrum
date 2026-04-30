'use client'

import { useState, useEffect, useMemo } from 'react'
import type { SpectrumBand, ZoomState } from '@/types/spectrum'
import { getBandsInViewport, getLODLevel } from '@/lib/zoom/lodController'
import { useSpectrumStore } from '@/store/spectrumStore'

let cachedBands: SpectrumBand[] | null = null

async function loadBands(): Promise<SpectrumBand[]> {
  if (cachedBands) return cachedBands
  const mod = await import('@/data/spectrum.json')
  cachedBands = mod.default as SpectrumBand[]
  return cachedBands
}

export function useSpectrumData(zoomState: ZoomState) {
  const [allBands, setAllBands] = useState<SpectrumBand[]>([])
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)

  useEffect(() => {
    loadBands().then(setAllBands)
  }, [])

  const visibleBands = useMemo(() => {
    if (allBands.length === 0) return []
    const lod = getLODLevel(zoomState.zoomLevel)

    const filtered = allBands.filter(b => {
      if (b.is_sound_overlay && !showSound) return false
      if (!b.is_sound_overlay && !showEM) return false
      return true
    })

    return getBandsInViewport(filtered, zoomState.centerFrequency, zoomState.zoomLevel, lod)
  }, [allBands, zoomState, showEM, showSound])

  return { visibleBands, allBands }
}
