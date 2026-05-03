const C = 299792458 // speed of light in m/s

// Covers ultra-slow cycles through high-energy EM: ~3.17 million years to 1e26 Hz.
export const F_MIN = 1e-14
export const F_MAX = 1e26
export const LOG_MIN = -14
export const LOG_MAX = 26
export const LOG_RANGE = LOG_MAX - LOG_MIN
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 5000

export function freqToScreenX(
  frequency: number,
  viewportWidth: number,
  centerFrequency: number,
  zoomLevel: number
): number {
  const logF = Math.log10(Math.max(frequency, F_MIN))
  const logCenter = Math.log10(Math.max(centerFrequency, F_MIN))
  const logSpan = LOG_RANGE / zoomLevel
  return ((logF - logCenter) / logSpan + 0.5) * viewportWidth
}

export function screenXToFreq(
  screenX: number,
  viewportWidth: number,
  centerFrequency: number,
  zoomLevel: number
): number {
  const logCenter = Math.log10(Math.max(centerFrequency, F_MIN))
  const logSpan = LOG_RANGE / zoomLevel
  const logF = (screenX / viewportWidth - 0.5) * logSpan + logCenter
  return Math.pow(10, Math.min(Math.max(logF, LOG_MIN), LOG_MAX))
}

export function freqToWavelength(frequency: number): number {
  return C / Math.max(frequency, 1e-300)
}

export function formatFrequency(hz: number): string {
  if (hz > 0 && hz < 1e-9) return `${(hz * 1e12).toPrecision(3)} pHz`
  if (hz >= 1e-9 && hz < 1e-6) return `${(hz * 1e9).toPrecision(3)} nHz`
  if (hz >= 1e-6 && hz < 1e-3) return `${(hz * 1e6).toPrecision(3)} uHz`
  if (hz >= 1e-3 && hz < 1) return `${(hz * 1e3).toPrecision(3)} mHz`
  if (hz >= 1e24) return `${(hz / 1e24).toFixed(2)} YHz`
  if (hz >= 1e21) return `${(hz / 1e21).toFixed(2)} ZHz`
  if (hz >= 1e18) return `${(hz / 1e18).toFixed(2)} EHz`
  if (hz >= 1e15) return `${(hz / 1e15).toFixed(2)} PHz`
  if (hz >= 1e12) return `${(hz / 1e12).toFixed(2)} THz`
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`
  return `${hz.toFixed(2)} Hz`
}

export function formatWavelength(meters: number): string {
  if (meters >= 1e3) return `${(meters / 1e3).toFixed(1)} km`
  if (meters >= 1) return `${meters.toFixed(2)} m`
  if (meters >= 1e-2) return `${(meters * 100).toFixed(1)} cm`
  if (meters >= 1e-3) return `${(meters * 1000).toFixed(1)} mm`
  if (meters >= 1e-6) return `${(meters * 1e6).toFixed(1)} um`
  if (meters >= 1e-9) return `${(meters * 1e9).toFixed(1)} nm`
  if (meters >= 1e-12) return `${(meters * 1e12).toFixed(1)} pm`
  return `${(meters * 1e15).toFixed(1)} fm`
}

export function clampFrequency(hz: number): number {
  return Math.min(Math.max(hz, F_MIN), F_MAX)
}

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)
}
