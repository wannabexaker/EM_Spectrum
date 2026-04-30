// Phase 17 — Deep Link URL State
// Encode: called after pan/zoom stabilizes (debounced 300ms)
import { clampFrequency, clampZoom } from '@/lib/zoom/logMapper'
export function encodeViewportState(centerFrequency: number, zoomLevel: number): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams({
    f: clampFrequency(centerFrequency).toExponential(3),
    z: clampZoom(zoomLevel).toFixed(2),
  })
  window.history.replaceState(null, '', `?${params.toString()}`)
}

// Decode: called once on page load in useEffect
export function decodeViewportState(): { centerFrequency: number; zoomLevel: number } | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const f = params.get('f')
  const z = params.get('z')
  if (!f || !z) return null
  const freq = parseFloat(f)
  const zoom = parseFloat(z)
  if (isNaN(freq) || isNaN(zoom) || freq <= 0 || zoom <= 0) return null
  return { centerFrequency: clampFrequency(freq), zoomLevel: clampZoom(zoom) }
}
