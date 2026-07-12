// Phase 17 — Deep Link URL State
// Encode: called after pan/zoom stabilizes (debounced 300ms)
import { clampFrequency, clampZoom } from '@/lib/zoom/logMapper'
import type { SpectrumDetailDensity } from '@/types/spectrum'

export function encodeViewportState(
  centerFrequency: number,
  zoomLevel: number,
  detailDensity?: SpectrumDetailDensity,
): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('f', clampFrequency(centerFrequency).toExponential(3))
  params.set('z', clampZoom(zoomLevel).toFixed(2))
  if (detailDensity) {
    params.set('d', detailDensity)
  } else {
    params.delete('d')
  }
  window.history.replaceState(null, '', `?${params.toString()}`)
}

// Decode: called once on page load in useEffect
export function decodeViewportState(): {
  centerFrequency: number
  zoomLevel: number
  detailDensity?: SpectrumDetailDensity
} | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const f = params.get('f')
  const z = params.get('z')
  if (!f || !z) return null
  const d = params.get('d')
  const freq = parseFloat(f)
  const zoom = parseFloat(z)
  if (isNaN(freq) || isNaN(zoom) || freq <= 0 || zoom <= 0) return null
  const detailDensity = d === 'clean' || d === 'details' || d === 'max' ? d : undefined
  return { centerFrequency: clampFrequency(freq), zoomLevel: clampZoom(zoom), detailDensity }
}

// Educational example deep link — `?edu=<id>` opens a specific story popup.
// Kept in sync with the open popup; preserves the viewport params (f/z/d).
export function setEduParam(id: string | null): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (id) params.set('edu', id)
  else params.delete('edu')
  const qs = params.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

export function getEduParam(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('edu')
}

export function decodeDetailDensityPreference(): SpectrumDetailDensity | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const d = params.get('d')
  if (d === 'clean' || d === 'details' || d === 'max') return d

  try {
    const stored = window.localStorage.getItem('density-pref-v1')
    if (stored === 'clean' || stored === 'details' || stored === 'max') return stored
  } catch {
    return null
  }

  return null
}
