// Phase 16 — Search Implementation
import Fuse from 'fuse.js'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import type { FrequencyFeature, SpectrumBand, TechnologyOverlay } from '@/types/spectrum'
import { LOG_RANGE, formatFrequency, formatWavelength, freqToWavelength } from '@/lib/zoom/logMapper'

export interface SearchResult {
  type: 'band' | 'technology'
  label: string
  sublabel: string
  targetFrequency: number
  targetZoom: number
  data: SpectrumBand | FrequencyFeature | TechnologyOverlay
}

let fuseIndex: Fuse<SpectrumBand> | null = null
let featureFuseIndex: Fuse<FrequencyFeature> | null = null

export function buildSearchIndex(bands: SpectrumBand[]): void {
  fuseIndex = new Fuse(bands, {
    keys: [
      { name: 'label',        weight: 0.4 },
      { name: 'subcategory',  weight: 0.3 },
      { name: 'applications', weight: 0.2 },
      { name: 'description',  weight: 0.1 },
    ],
    threshold: 0.35,
    includeScore: true,
  })
}

export function buildFeatureSearchIndex(): void {
  featureFuseIndex = new Fuse(frequencyFeatures, {
    keys: [
      { name: 'label', weight: 0.34 },
      { name: 'shortLabel', weight: 0.24 },
      { name: 'family', weight: 0.22 },
      { name: 'detail', weight: 0.20 },
    ],
    threshold: 0.34,
    includeScore: true,
  })
}

export function search(query: string, bands: SpectrumBand[]): SearchResult[] {
  if (!query.trim()) return []

  // Try parsing as frequency (e.g. "2.4 GHz", "2.4e9", "100 MHz")
  const freqMatch = _parseFrequencyQuery(query)
  if (freqMatch !== null) {
    const band = _findBandContaining(freqMatch, bands)
    if (band) return [_frequencyResult(freqMatch, band)]
  }

  // Try parsing as wavelength (e.g. "12 cm", "1550 nm")
  const wlMatch = _parseWavelengthQuery(query)
  if (wlMatch !== null) {
    const freq = 299792458 / wlMatch
    const band = _findBandContaining(freq, bands)
    if (band) return [_frequencyResult(freq, band)]
  }

  // Keyword search via Fuse.js
  if (!fuseIndex) buildSearchIndex(bands)
  if (!featureFuseIndex) buildFeatureSearchIndex()

  const featureResults = featureFuseIndex!
    .search(query)
    .map(({ item }) => _featureResult(item))

  const bandResults = fuseIndex!
    .search(query)
    .map(({ item }) => ({
      type: 'band' as const,
      label: item.label,
      sublabel: `${formatFrequency(item.frequency_min)} – ${formatFrequency(item.frequency_max)}`,
      targetFrequency: Math.sqrt(item.frequency_min * item.frequency_max),
      targetZoom: 8,
      data: item,
    }))

  return [...featureResults, ...bandResults].slice(0, 10)
}

// Legacy helper used by SearchBar — returns SpectrumBand[] directly
export function searchBands(query: string, bands: SpectrumBand[]): SpectrumBand[] {
  return search(query, bands)
    .filter(r => r.type === 'band')
    .map(r => r.data as SpectrumBand)
}

function _parseFrequencyQuery(q: string): number | null {
  const clean = q.trim().toLowerCase().replace(/\s+/g, '')
  const multipliers: Record<string, number> = {
    hz: 1, khz: 1e3, mhz: 1e6, ghz: 1e9, thz: 1e12,
    phz: 1e15, ehz: 1e18, zhz: 1e21, yhz: 1e24,
  }
  const m = clean.match(/^([\d.e+\-]+)(hz|khz|mhz|ghz|thz|phz|ehz|zhz|yhz)?$/)
  if (!m) return null
  const val = parseFloat(m[1] ?? '')
  const unit = m[2] ?? 'hz'
  const mult = multipliers[unit] ?? 1
  return isNaN(val) ? null : val * mult
}

function _parseWavelengthQuery(q: string): number | null {
  const clean = q.trim().toLowerCase().replace(/\s+/g, '')
  const multipliers: Record<string, number> = {
    km: 1e3, m: 1, cm: 1e-2, mm: 1e-3, um: 1e-6, μm: 1e-6,
    nm: 1e-9, pm: 1e-12, fm: 1e-15,
  }
  const m = clean.match(/^([\d.]+)(km|cm|mm|um|μm|nm|pm|fm|m)$/)
  if (!m) return null
  const val = parseFloat(m[1] ?? '')
  const unit = m[2] ?? 'm'
  const mult = multipliers[unit] ?? 1
  return isNaN(val) ? null : val * mult
}

function _findBandContaining(freq: number, bands: SpectrumBand[]): SpectrumBand | null {
  return bands.find(b => freq >= b.frequency_min && freq <= b.frequency_max) ?? null
}

function _frequencyResult(freq: number, band: SpectrumBand): SearchResult {
  return {
    type: 'band',
    label: `${formatFrequency(freq)} — ${band.label}`,
    sublabel: `λ = ${formatWavelength(freqToWavelength(freq))}`,
    targetFrequency: freq,
    targetZoom: 10,
    data: band,
  }
}

function _featureResult(feature: FrequencyFeature): SearchResult {
  const half = feature.frequency_bandwidth / 2
  const min = Math.max(1, feature.frequency_center - half)
  const max = feature.frequency_center + half
  const logSpan = Math.max(Math.log10(max) - Math.log10(min), 0.002)

  return {
    type: 'technology',
    label: feature.label,
    sublabel: `${feature.family} â€” ${formatFrequency(min)}â€“${formatFrequency(max)}`,
    targetFrequency: feature.frequency_center,
    targetZoom: Math.max(8, Math.min(100, LOG_RANGE / (logSpan * 6))),
    data: feature,
  }
}
