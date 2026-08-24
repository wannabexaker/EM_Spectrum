import Fuse from 'fuse.js'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { EDUCATIONAL_EXAMPLES, type EducationalExample } from '@/data/educationalExamples'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import {
  PROFESSIONAL_SUB_BANDS,
  PROFESSIONAL_TECH_OVERLAYS,
  type ProfessionalBand,
  type ProfessionalTechnology,
} from '@/data/professionalSpectrum'
import type { FrequencyFeature, SpectrumBand } from '@/types/spectrum'
import { F_MIN, LOG_RANGE, formatFrequency, formatWavelength, freqToWavelength } from '@/lib/zoom/logMapper'
import { featureRange } from '@/lib/spectrum/featureRange'

export interface SearchResult {
  type: 'band' | 'technology' | 'atlas' | 'educational' | 'pro-band' | 'pro-tech'
  label: string
  sublabel: string
  targetFrequency: number
  targetZoom: number
  // Note: `type: 'technology'` results carry a FrequencyFeature. TechnologyOverlay was
  // listed here but never instantiated, so the union claimed a shape search never returns.
  data:
    | SpectrumBand
    | FrequencyFeature
    | EducationalExample
    | ProfessionalBand
    | ProfessionalTechnology
}

export interface SearchOptions {
  rfOnly?: boolean
}

interface FrequencyQueryCandidate {
  frequency: number
  label: string
  priority: number
  explicitUnit: boolean
}

let fuseIndex: Fuse<SpectrumBand> | null = null
let featureFuseIndex: Fuse<FrequencyFeature> | null = null
let educationalFuseIndex: Fuse<EducationalExample> | null = null
let proBandFuseIndex: Fuse<ProfessionalBand> | null = null
let proTechFuseIndex: Fuse<ProfessionalTechnology> | null = null

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
      { name: 'standard', weight: 0.1 },
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

/** ITU sub-bands and technology allocations shown in professional mode. Without these
 *  the whole professional dataset was unsearchable — "ELF", "WiGig" or "5G" returned
 *  nothing from the very layers professional mode draws. */
export function buildProfessionalSearchIndex(): void {
  proBandFuseIndex = new Fuse(PROFESSIONAL_SUB_BANDS, {
    keys: [
      { name: 'label', weight: 0.4 },
      { name: 'rangeLabel', weight: 0.2 },
      { name: 'uses', weight: 0.28 },
      { name: 'standard', weight: 0.12 },
    ],
    threshold: 0.34,
    includeScore: true,
  })
  proTechFuseIndex = new Fuse(PROFESSIONAL_TECH_OVERLAYS, {
    keys: [
      { name: 'label', weight: 0.42 },
      { name: 'detail', weight: 0.3 },
      { name: 'standard', weight: 0.16 },
      { name: 'category', weight: 0.12 },
    ],
    threshold: 0.34,
    includeScore: true,
  })
}

export function search(query: string, bands: SpectrumBand[], options: SearchOptions = {}): SearchResult[] {
  if (!query.trim()) return []

  const freqMatches = _parseFrequencyQueryCandidates(query)
  if (freqMatches.length > 0) {
    return _frequencyQueryResults(query.trim(), freqMatches, bands, options)
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
  if (!proBandFuseIndex || !proTechFuseIndex) buildProfessionalSearchIndex()

  // Score-ranked merge across all three indexes so the most relevant match wins
  // regardless of type. A query like "MRI" should surface the MRI story, not be
  // buried under loosely-fuzzy feature matches (Maritime, Military…). Lower Fuse
  // score = better; typeRank breaks ties (educational stories, then features, then bands).
  const scored: Array<{ result: SearchResult; score: number; typeRank: number }> = []
  for (const { item, score } of featureFuseIndex!.search(query)) {
    scored.push({ result: _featureResult(item), score: score ?? 1, typeRank: 1 })
  }
  for (const { item, score } of educationalFuseIndex!.search(query)) {
    scored.push({ result: _educationalResult(item), score: score ?? 1, typeRank: 0 })
  }
  for (const { item, score } of proTechFuseIndex!.search(query)) {
    scored.push({
      result: {
        type: 'pro-tech' as const,
        label: item.label,
        sublabel: item.standard ?? item.detail,
        targetFrequency: item.frequency,
        targetZoom: Math.max(item.minZoom, 12),
        data: item,
      },
      score: score ?? 1,
      typeRank: 1,
    })
  }
  for (const { item, score } of proBandFuseIndex!.search(query)) {
    scored.push({
      result: {
        type: 'pro-band' as const,
        label: `${item.label} (ITU)`,
        sublabel: `${item.rangeLabel} · ${item.uses}`,
        targetFrequency: Math.sqrt(item.frequencyMin * item.frequencyMax),
        targetZoom: 8,
        data: item,
      },
      score: score ?? 1,
      typeRank: 2,
    })
  }
  for (const { item, score } of fuseIndex!.search(query)) {
    scored.push({
      result: {
        type: 'band' as const,
        label: item.label,
        sublabel: `${formatFrequency(item.frequency_min)} - ${formatFrequency(item.frequency_max)}`,
        targetFrequency: Math.sqrt(item.frequency_min * item.frequency_max),
        targetZoom: 8,
        data: item,
      },
      score: score ?? 1,
      typeRank: 2,
    })
  }

  scored.sort((a, b) => (a.score - b.score) || (a.typeRank - b.typeRank))

  // Dedup by target id, keeping the best-ranked occurrence.
  const seen = new Set<string>()
  const merged: SearchResult[] = []
  for (const { result } of scored) {
    const id = result.data.id
    if (seen.has(id)) continue
    seen.add(id)
    merged.push(result)
  }

  const visibleResults = options.rfOnly
    ? merged.filter(result =>
        result.type === 'band' ||
        result.type === 'technology' ||
        result.type === 'pro-band' ||
        result.type === 'pro-tech')
    : merged

  return visibleResults.slice(0, 14)
}

export function searchBands(query: string, bands: SpectrumBand[]): SpectrumBand[] {
  return search(query, bands)
    .filter(r => r.type === 'band')
    .map(r => r.data as SpectrumBand)
}

function _parseFrequencyQueryCandidates(q: string): FrequencyQueryCandidate[] {
  const clean = q.trim().toLowerCase().replace(/\s+/g, '')
  const multipliers: Record<string, number> = {
    hz: 1, khz: 1e3, mhz: 1e6, ghz: 1e9, thz: 1e12,
    phz: 1e15, ehz: 1e18, zhz: 1e21, yhz: 1e24,
    bpm: 1 / 60, rpm: 1 / 60,
  }
  const m = clean.match(/^([\d.e+\-]+)(hz|khz|mhz|ghz|thz|phz|ehz|zhz|yhz|bpm|rpm)?$/)
  if (!m) return []
  const val = parseFloat(m[1] ?? '')
  if (!Number.isFinite(val)) return []
  const hasDecimalOrExponent = /[.e]/i.test(m[1] ?? '')

  const explicitUnit = Boolean(m[2])
  if (explicitUnit) {
    const unit = m[2] ?? 'hz'
    const mult = multipliers[unit] ?? 1
    return [{
      frequency: Math.max(val * mult, F_MIN),
      label: `${val} ${unit.toUpperCase()}`,
      priority: 0,
      explicitUnit: true,
    }]
  }

  const candidates: FrequencyQueryCandidate[] = []
  const addCandidate = (frequency: number, label: string, priority: number) => {
    if (!Number.isFinite(frequency) || frequency <= 0) return
    if (candidates.some(item => Math.abs(Math.log10(item.frequency) - Math.log10(frequency)) < 1e-9)) return
    candidates.push({
      frequency: Math.max(frequency, F_MIN),
      label,
      priority,
      explicitUnit: false,
    })
  }

  if (val >= 300 && val <= 999_999) {
    addCandidate(val * 1e6, `${val} MHz`, 0)
    addCandidate(val, `${val} Hz`, 3)
  } else if (val >= 10 && val < 300) {
    if (hasDecimalOrExponent) {
      addCandidate(val * 1e6, `${val} MHz`, 0)
      addCandidate(val, `${val} Hz`, 2)
    } else {
      addCandidate(val, `${val} Hz`, 0)
      addCandidate(val * 1e6, `${val} MHz`, 1)
    }
  } else if (val > 0 && val < 10) {
    if (hasDecimalOrExponent) {
      addCandidate(val * 1e9, `${val} GHz`, 0)
      addCandidate(val * 1e6, `${val} MHz`, 1)
      addCandidate(val, `${val} Hz`, 3)
    } else {
      addCandidate(val, `${val} Hz`, 0)
      addCandidate(val * 1e9, `${val} GHz`, 1)
      addCandidate(val * 1e6, `${val} MHz`, 2)
    }
  } else {
    addCandidate(val, `${val} Hz`, 0)
  }

  return candidates
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

function _frequencyQueryResults(query: string, candidates: FrequencyQueryCandidate[], bands: SpectrumBand[], options: SearchOptions): SearchResult[] {
  const rawFeatureMatches = candidates
    .flatMap(candidate => _findFeatureMatches(candidate.frequency).map(match => ({ ...match, candidate })))

  const bestMatchedPriority = rawFeatureMatches.length > 0
    ? Math.min(...rawFeatureMatches.map(match => match.candidate.priority))
    : 0
  const priorityMatches = rawFeatureMatches.filter(match => match.candidate.priority === bestMatchedPriority)

  const exactCandidateFrequencies = new Set(
    priorityMatches
      .filter(match => match.score < 0.001)
      .map(match => match.candidate.frequency)
  )

  const featureMatches = (exactCandidateFrequencies.size > 0
    ? priorityMatches.filter(match => exactCandidateFrequencies.has(match.candidate.frequency))
    : priorityMatches
  )
    .sort((a, b) => {
      const aExact = a.score < 0.001 ? 0 : 1
      const bExact = b.score < 0.001 ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
      if (a.candidate.priority !== b.candidate.priority) return a.candidate.priority - b.candidate.priority
      if (Boolean(a.feature.atlasCategory) !== Boolean(b.feature.atlasCategory)) {
        return a.feature.atlasCategory ? 1 : -1
      }
      if (a.score !== b.score) return a.score - b.score
      return a.feature.frequency_bandwidth - b.feature.frequency_bandwidth
    })

  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const match of featureMatches) {
    if (seen.has(match.feature.id)) continue
    seen.add(match.feature.id)
    if (!options.rfOnly || !match.feature.atlasCategory) {
      results.push(_featureResult(match.feature))
    }
  }

  const bestCandidate = featureMatches[0]?.candidate ?? candidates[0]
  if (bestCandidate) {
    const band = _findBandContaining(bestCandidate.frequency, bands)
    const frequencyResult = band
      ? _frequencyResult(bestCandidate.frequency, band)
      : _freeFrequencyResult(bestCandidate.frequency, `Frequency ${query}`)

    results.push(frequencyResult)
  }

  return results.slice(0, 14)
}

function _findFeatureMatches(freq: number): Array<{ feature: FrequencyFeature; score: number }> {
  return frequencyFeatures
    .map(feature => {
      const { min, max } = featureRange(feature)
      // Normaliser for the closeness score: half the real band, floored so a
      // zero-width feature cannot divide by zero.
      const half = Math.max((max - min) / 2, feature.frequency_center * 1e-9, F_MIN)

      if (freq < min || freq > max) return null

      return {
        feature,
        score: Math.abs(freq - feature.frequency_center) / half,
      }
    })
    .filter((item): item is { feature: FrequencyFeature; score: number } => item !== null)
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
  const { min, max: rawMax } = featureRange(feature)
  const max = Math.max(min * 1.0001, rawMax)
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
