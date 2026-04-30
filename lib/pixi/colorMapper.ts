// Phase 14 — Accurate Visible Spectrum Color Mapping (Dan Bruton CIE approximation)
import type { SpectrumCategory } from '@/types/spectrum'

export const BAND_COLORS: Record<SpectrumCategory, number> = {
  radio:       0x00D4FF,   // cyan
  microwave:   0x00FF88,   // teal-green
  infrared:    0xFF6B35,   // orange
  visible:     0xFFFFFF,   // computed per sub-band
  ultraviolet: 0xC77DFF,   // violet
  xray:        0x4CC9F0,   // ice blue
  gamma:       0xFF006E,   // hot pink
  sound:       0xFFD60A,   // yellow (overlay)
}

export function wavelengthToRGB(wavelength_nm: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0
  const w = wavelength_nm

  if      (w >= 380 && w < 440) { r = -(w - 440) / 60; g = 0;               b = 1 }
  else if (w >= 440 && w < 490) { r = 0;               g = (w - 440) / 50;  b = 1 }
  else if (w >= 490 && w < 510) { r = 0;               g = 1;               b = -(w - 510) / 20 }
  else if (w >= 510 && w < 580) { r = (w - 510) / 70;  g = 1;               b = 0 }
  else if (w >= 580 && w < 645) { r = 1;               g = -(w - 645) / 65; b = 0 }
  else if (w >= 645 && w <= 750){ r = 1;               g = 0;               b = 0 }

  // Intensity drop-off at spectrum edges (eye sensitivity)
  let factor = 1.0
  if      (w >= 380 && w < 420)  factor = 0.3 + 0.7 * (w - 380) / 40
  else if (w >= 700 && w <= 750) factor = 0.3 + 0.7 * (750 - w) / 50

  const gamma = 0.8
  const toInt = (c: number) => Math.round(255 * Math.pow(Math.max(0, c * factor), gamma))
  return { r: toInt(r), g: toInt(g), b: toInt(b) }
}

export function wavelengthToPixiColor(wavelength_nm: number): number {
  const { r, g, b } = wavelengthToRGB(wavelength_nm)
  return (r << 16) | (g << 8) | b
}

// Pre-compute visible spectrum as CSS gradient for the landing page preview bar
export function getVisibleSpectrumGradient(): string {
  const stops: string[] = []
  for (let nm = 380; nm <= 750; nm += 5) {
    const { r, g, b } = wavelengthToRGB(nm)
    const pct = (((nm - 380) / 370) * 100).toFixed(1)
    stops.push(`rgb(${r},${g},${b}) ${pct}%`)
  }
  return `linear-gradient(to right, ${stops.join(', ')})`
}

// Helper: pick correct color for a band (visible uses wavelength → PixiJS color)
export function getBandColor(
  category: SpectrumCategory,
  wavelength_min?: number,
  wavelength_max?: number
): number {
  if (category === 'visible' && wavelength_min !== undefined && wavelength_max !== undefined) {
    const centerNm = ((wavelength_min + wavelength_max) / 2) * 1e9
    return wavelengthToPixiColor(centerNm)
  }
  return BAND_COLORS[category] ?? 0xffffff
}
