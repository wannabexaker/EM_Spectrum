import Fuse from 'fuse.js'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { EDUCATIONAL_EXAMPLES, type EducationalExample } from '@/data/educationalExamples'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import type { FrequencyFeature, SpectrumBand, TechnologyOverlay } from '@/types/spectrum'
import { F_MIN, LOG_RANGE, formatFrequency, formatWavelength, freqToWavelength } from '@/lib/zoom/logMapper'

export interface SearchResult {
  type: 'band' | 'technology' | 'atlas' | 'educational'
  label: string
  sublabel: string
  targetFrequency: number
  targetZoom: number
  data: SpectrumBand | FrequencyFeature | TechnologyOverlay | EducationalExample
}

let fuseIndex: Fuse<SpectrumBand> | null = null
let featureFuseIndex: Fuse<FrequencyFeature> | null = null
let educationalFuseIndex: Fuse<EducationalExample> | null = null

export function buildSearchIndex(bands: SpectrumBand[]): void {
  fuseIndex = new Fuse(bands, {
    keys: [
      { name: 'label', weight: 0.4 },
      { name: 'subcategory', weight: 0.3 },
      { name: 'applications', weight: 0.2 },
      { name: 'description', weight: 0.1 },
    ],
    threshold: 0.35,
    includeScore: true,
  })
}

export function buildFeatureSearchIndex(): void {
  featureFuseIndex = new Fuse(frequencyFeatures, {
    keys: [
      { name: 'label', weight: 0.28 },
      { name: 'shortLabel', weight: 0.18 },
      { name: 'family', weight: 0.14 },
      { name: 'aliases', weight: 0.16 },
      { name: 'modulationTypes', weight: 0.12 },
      { name: 'atlasCategory', weight: 0.08 },
      { name: 'confidence', weight: 0.06 },
      { name: 'listPath', weight: 0.06 },
      { name: 'sources.label', weight: 0.04 },
      { name: 'detail', weight: 0.16 },
    ],
    threshold: 0.34,
    includeScore: true,
  })
}

export function buildEducationalSearchIndex(): void {
  educationalFuseIndex = new Fuse(EDUCATIONAL_EXAMPLES, {
    keys: [
      { name: 'label', weight: 0.38 },
      { name: 'shortLabel', weight: 0.24 },
      { name: 'story', weight: 0.22 },
      { name: 'relatedIds', weight: 0.16 },
    ],
    threshold: 0.34,
    includeScore: true,
  })
}

export function search(query: string, bands: SpectrumBand[]): SearchResult[] {
  if (!query.trim()) return []

  const freqMatch = _parseFrequencyQuery(query)
  if (freqMatch !== null) {
    const band = _findBandContaining(freqMatch, bands)
    return band ? [_frequencyResult(freqMatch, band)] : [_freeFrequencyResult(freqMatch, `Frequency ${query.trim()}`)]
  }

  const periodFrequency = _parsePeriodQuery(query)
  if (periodFrequency !== null) {
    const band = _findBandContaining(periodFrequency, bands)
    return band ? [_frequencyResult(periodFrequency, band)] : [_freeFrequencyResult(periodFrequency, `Period ${query.trim()}`)]
  }

  const wlMatch = _parseWavelengthQuery(query)
  if (wlMatch !== null) {
    const freq = 299792458 / wlMatch
    const band = _findBandContaining(freq, bands)
    if (band) return [_frequencyResult(freq, band)]
  }

  if (!fuseIndex) buildSearchIndex(bands)
  if (!featureFuseIndex) buildFeatureSearchIndex()
  if (!educationalFuseIndex) buildEducationalSearchIndex()

  const featureResults = featureFuseIndex!.search(query).map(({ item }) => _featureResult(item))
  const educationalResults = educationalFuseIndex!.search(query).map(({ item }) => _educationalResult(item))
  const bandResults = fuseIndex!.search(query).map(({ item }) => ({
    type: 'band' as const,
    label: item.label,
    sublabel: `${formatFrequency(item.frequency_min)} - ${formatFrequency(item.frequency_max)}`,
    targetFrequency: Math.sqrt(item.frequency_min * item.frequency_max),
    targetZoom: 8,
    data: item,
  }))

  return [...featureResults, ...educationalResults, ...bandResults].slice(0, 14)
}

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
    bpm: 1 / 60, rpm: 1 / 60,
  }
  const m = clean.match(/^([\d.e+\-]+)(hz|khz|mhz|ghz|thz|phz|ehz|zhz|yhz|bpm|rpm)?$/)
  if (!m) return null
  const val = parseFloat(m[1] ?? '')
  const unit = m[2] ?? 'hz'
  const mult = multipliers[unit] ?? 1
  return Number.isFinite(val) ? Math.max(val * mult, F_MIN) : null
}

function _parsePeriodQuery(q: string): number | null {
  const clean = q.trim().toLowerCase().replace(/\s+/g, '')
  const multipliers: Record<string, number> = {
    ms: 1e-3, millisecond: 1e-3, milliseconds: 1e-3,
    s: 1, sec: 1, second: 1, seconds: 1,
    min: 60, minute: 60, minutes: 60,
    h: 3600, hr: 3600, hour: 3600, hours: 3600,
    d: 86400, day: 86400, days: 86400,
    y: 365.2425 * 86400, yr: 365.2425 * 86400, year: 365.2425 * 86400, years: 365.2425 * 86400,
  }
  const m = clean.match(/^(?:period|cycle|every)?([\d.e+\-]+)(ms|milliseconds?|s|sec|seconds?|min|minutes?|h|hr|hours?|d|days?|y|yr|years?)$/)
  if (!m) return null
  const val = parseFloat(m[1] ?? '')
  const unit = m[2] ?? 's'
  const seconds = val * (multipliers[unit] ?? 1)
  return seconds > 0 && Number.isFinite(seconds) ? Math.max(1 / seconds, F_MIN) : null
}

function _parseWavelengthQuery(q: string): number | null {
  const clean = q.trim().toLowerCase().replace(/\s+/g, '')
  const multipliers: Record<string, number> = {
    km: 1e3, m: 1, cm: 1e-2, mm: 1e-3, um: 1e-6,
    nm: 1e-9, pm: 1e-12, fm: 1e-15,
  }
  const m = clean.match(/^([\d.]+)(km|cm|mm|um|nm|pm|fm|m)$/)
  if (!m) return null
  const val = parseFloat(m[1] ?? '')
  const unit = m[2] ?? 'm'
  const mult = multipliers[unit] ?? 1
  return Number.isFinite(val) ? val * mult : null
}

function _findBandContaining(freq: number, bands: SpectrumBand[]): SpectrumBand | null {
  return bands.find(b => freq >= b.frequency_min && freq <= b.frequency_max) ?? null
}

function _frequencyResult(freq: number, band: SpectrumBand): SearchResult {
  return {
    type: 'band',
    label: `${formatFrequency(freq)} - ${band.label}`,
    sublabel: `lambda = ${formatWavelength(freqToWavelength(freq))}`,
    targetFrequency: freq,
    targetZoom: 10,
    data: band,
  }
}

function _freeFrequencyResult(freq: number, label: string): SearchResult {
  return {
    type: 'atlas',
    label,
    sublabel: `${formatFrequency(freq)} cycle rate`,
    targetFrequency: freq,
    targetZoom: 10,
    data: {
      id: `parsed-${freq}`,
      label,
      shortLabel: 'Parsed',
      frequency_center: freq,
      frequency_bandwidth: Math.max(freq * 0.08, F_MIN),
      category: 'sound',
      family: 'Parsed query',
      detail: 'Parsed from a frequency or period query.',
      color: '#7dd3fc',
      minZoom: 1,
      atlasCategory: 'physics',
      confidence: 'Estimated / Approximate',
      aliases: [],
    },
  }
}

function _featureResult(feature: FrequencyFeature): SearchResult {
  const half = feature.frequency_bandwidth / 2
  const min = Math.max(F_MIN, feature.frequency_center - half)
  const max = Math.max(min * 1.0001, feature.frequency_center + half)
  const logSpan = Math.max(Math.log10(max) - Math.log10(min), 0.002)
  const group = feature.atlasCategory ? ATLAS_CATEGORY_LABELS[feature.atlasCategory] : feature.family

  return {
    type: feature.atlasCategory ? 'atlas' : 'technology',
    label: feature.label,
    sublabel: `${group} - ${formatFrequency(min)}-${formatFrequency(max)}`,
    targetFrequency: feature.frequency_center,
    targetZoom: Math.max(8, Math.min(100, LOG_RANGE / (logSpan * 6))),
    data: feature,
  }
}

function _educationalResult(example: EducationalExample): SearchResult {
  return {
    type: 'educational',
    label: example.label,
    sublabel: `Educational story - ${formatFrequency(example.frequency)}`,
    targetFrequency: example.frequency,
    targetZoom: 8,
    data: example,
  }
}
