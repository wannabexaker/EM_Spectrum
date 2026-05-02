import type { LODLevel, SpectrumBand } from '@/types/spectrum'
import { F_MIN, LOG_RANGE } from './logMapper'

// Zoom thresholds for each LOD level — log-spaced across 0.5→100
// LOD 0 = full overview, LOD 10 = maximum deep zoom
const LOD_THRESHOLDS = [1.0, 1.6, 2.5, 4.0, 6.3, 10, 16, 25, 40, 63, 100] as const

export function getLODLevel(zoomLevel: number): LODLevel {
  for (let i = 0; i < LOD_THRESHOLDS.length; i++) {
    if (zoomLevel < LOD_THRESHOLDS[i]!) return i as LODLevel
  }
  return 10
}

export function getBandsInViewport(
  bands: SpectrumBand[],
  centerFrequency: number,
  zoomLevel: number,
  lod: LODLevel
): SpectrumBand[] {
  const logCenter = Math.log10(Math.max(centerFrequency, F_MIN))
  const logSpan = LOG_RANGE / zoomLevel
  const logMin = logCenter - logSpan / 2
  const logMax = logCenter + logSpan / 2

  return bands.filter(band => {
    const bandLogMin = Math.log10(Math.max(band.frequency_min, F_MIN))
    const bandLogMax = Math.log10(Math.max(band.frequency_max, F_MIN))
    return bandLogMax >= logMin && bandLogMin <= logMax
  })
}

// Band lod_level (0–3 in data) maps to zoom fade thresholds.
// The fade window is narrower now (0.65→1.1 vs old 0.55→1.2) for crisper transitions.
const BAND_LOD_ZOOM_THRESHOLDS = [0.1, 1.5, 8, 40] as const

export function getLODVisibility(requiredLOD: LODLevel, zoomLevel: number): number {
  // Band data only uses lod_level 0–3; values 4–10 are reserved for future data
  const threshold = BAND_LOD_ZOOM_THRESHOLDS[requiredLOD as 0 | 1 | 2 | 3] ?? 40
  if (requiredLOD === 0) return 1
  const fadeStart = threshold * 0.65
  const fadeEnd   = threshold * 1.10
  const t = Math.max(0, Math.min(1, (zoomLevel - fadeStart) / (fadeEnd - fadeStart)))
  return t * t * (3 - 2 * t) // smoothstep
}
