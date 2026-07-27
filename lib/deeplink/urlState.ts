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

// Card deep links — `?edu=`, `?feature=` and `?pro=` each reopen a specific detail panel:
// an educational story, an RF/atlas feature card, or a professional allocation. Only one
// panel can be open at a time, so the params are mutually exclusive: writing one clears
// the others. Viewport params (f/z/d) are always preserved.
export type CardParam = 'edu' | 'feature' | 'pro'

const CARD_PARAMS: CardParam[] = ['edu', 'feature', 'pro']

export function setCardParam(kind: CardParam, id: string | null): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  for (const key of CARD_PARAMS) params.delete(key)
  if (id) params.set(kind, id)
  const qs = params.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

/** The card the current URL points at, if any. */
export function getCardParam(): { kind: CardParam; id: string } | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  for (const key of CARD_PARAMS) {
    const id = params.get(key)
    if (id) return { kind: key, id }
  }
  return null
}

/** Absolute link that reopens this card at the current viewport — for "copy link". */
export function buildCardLink(kind: CardParam, id: string): string {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  for (const key of CARD_PARAMS) params.delete(key)
  params.set(kind, id)
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
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
