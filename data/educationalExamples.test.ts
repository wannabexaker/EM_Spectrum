import { describe, it, expect } from 'vitest'
import {
  EDUCATIONAL_EXAMPLES,
  EDUCATIONAL_EXAMPLE_MAP,
  EDUCATIONAL_DOMAINS,
  isEduExampleVisible,
  type EducationalExample,
} from './educationalExamples'

const CONFIDENCE_VALUES = new Set([
  'Scientifically Verified', 'Strong Evidence', 'Estimated / Approximate', 'Theoretical',
  'Anecdotal', 'Folklore / Cultural Claim', 'Pseudoscience / Unsupported', 'Unknown / Needs Validation',
])
// [min, max] Hz per lane — mirror of SPECTRUM_LANES / the data validator.
const LANE_RANGE: Record<string, [number, number]> = {
  radio: [3, 3e9], microwave: [3e9, 3e12], infrared: [3e12, 4.3e14], visible: [4e14, 7.9e14],
  ultraviolet: [7.5e14, 3e16], xray: [3e16, 3e20], gamma: [3e19, 1e26], sound: [1e-14, 2e8],
}

const sample = (over: Partial<EducationalExample> = {}): EducationalExample => ({
  id: 'x', label: 'X', shortLabel: 'X', frequency: 100, color: 0xffffff,
  category: 'sound', discoveredBy: 'Y', discoveredYear: 2000, story: 's', relatedIds: [],
  confidence: 'Scientifically Verified', atlasCategory: 'animals', ...over,
})

describe('isEduExampleVisible', () => {
  it('shows everything when no filters are set', () => {
    expect(isEduExampleVisible(sample(), [], false)).toBe(true)
  })
  it('hides an example whose domain is in the hidden list', () => {
    expect(isEduExampleVisible(sample({ atlasCategory: 'animals' }), ['animals'], false)).toBe(false)
    expect(isEduExampleVisible(sample({ atlasCategory: 'physics' }), ['animals'], false)).toBe(true)
  })
  it('verifiedOnly gates out anything not Scientifically Verified', () => {
    expect(isEduExampleVisible(sample({ confidence: 'Scientifically Verified' }), [], true)).toBe(true)
    expect(isEduExampleVisible(sample({ confidence: 'Strong Evidence' }), [], true)).toBe(false)
    expect(isEduExampleVisible(sample({ confidence: 'Estimated / Approximate' }), [], true)).toBe(false)
  })
})

describe('EDUCATIONAL_DOMAINS', () => {
  it('is sorted by count descending and totals the tagged examples', () => {
    const counts = EDUCATIONAL_DOMAINS.map(d => d.count)
    expect([...counts].sort((a, b) => b - a)).toEqual(counts)
    const total = EDUCATIONAL_DOMAINS.reduce((s, d) => s + d.count, 0)
    const tagged = EDUCATIONAL_EXAMPLES.filter(e => e.atlasCategory).length
    expect(total).toBe(tagged)
  })
})

describe('dataset invariants', () => {
  it('has unique ids and a matching lookup map', () => {
    const ids = new Set(EDUCATIONAL_EXAMPLES.map(e => e.id))
    expect(ids.size).toBe(EDUCATIONAL_EXAMPLES.length)
    expect(EDUCATIONAL_EXAMPLE_MAP.size).toBe(EDUCATIONAL_EXAMPLES.length)
  })

  it('every entry is fully tagged (confidence, domain, sources) with positive frequency', () => {
    for (const e of EDUCATIONAL_EXAMPLES) {
      expect(e.frequency, e.id).toBeGreaterThan(0)
      expect(CONFIDENCE_VALUES.has(e.confidence ?? ''), `${e.id} confidence`).toBe(true)
      expect(e.atlasCategory, `${e.id} atlasCategory`).toBeTruthy()
      expect((e.sources?.length ?? 0), `${e.id} sources`).toBeGreaterThan(0)
    }
  })

  it('relatedIds only reference existing entries and never themselves', () => {
    for (const e of EDUCATIONAL_EXAMPLES) {
      for (const rid of e.relatedIds) {
        expect(rid, `${e.id} -> ${rid}`).not.toBe(e.id)
        expect(EDUCATIONAL_EXAMPLE_MAP.has(rid), `${e.id} -> ${rid}`).toBe(true)
      }
    }
  })

  it('every frequency sits within its category lane range', () => {
    for (const e of EDUCATIONAL_EXAMPLES) {
      const r = LANE_RANGE[e.category]
      expect(r, `${e.id}: unknown category '${e.category}'`).toBeTruthy()
      expect(
        e.frequency >= r[0] && e.frequency <= r[1],
        `${e.id}: ${e.frequency} Hz outside ${e.category} [${r[0]}, ${r[1]}]`,
      ).toBe(true)
    }
  })
})
