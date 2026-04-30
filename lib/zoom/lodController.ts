import type { LODLevel, SpectrumBand } from '@/types/spectrum'
import { LOG_MAX, LOG_RANGE } from './logMapper'

export function getLODLevel(zoomLevel: number): LODLevel {
  if (zoomLevel < 1.5) return 0
  if (zoomLevel < 8)   return 1
  if (zoomLevel < 40)  return 2
  return 3
}

export function getBandsInViewport(
  bands: SpectrumBand[],
  centerFrequency: number,
  zoomLevel: number,
  lod: LODLevel
): SpectrumBand[] {
  const logCenter = Math.log10(Math.max(centerFrequency, 1))
  const logSpan = LOG_RANGE / zoomLevel
  const logMin = logCenter - logSpan / 2
  const logMax = logCenter + logSpan / 2

  return bands.filter(band => {
    const bandLogMin = Math.log10(Math.max(band.frequency_min, 1))
    const bandLogMax = Math.log10(Math.max(band.frequency_max, 1))
    const inViewport = bandLogMax >= logMin && bandLogMin <= logMax
    return inViewport
  })
}

export function getLODVisibility(requiredLOD: LODLevel, zoomLevel: number): number {
  const thresholds = [0.1, 1.5, 8, 40]
  const threshold = thresholds[requiredLOD] ?? 40
  if (requiredLOD === 0) return 1
  const fadeStart = threshold * 0.55
  const fadeEnd = threshold * 1.2
  return Math.max(0, Math.min(1, (zoomLevel - fadeStart) / (fadeEnd - fadeStart)))
}
