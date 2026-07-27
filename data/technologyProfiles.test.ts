import { describe, expect, it } from 'vitest'
import { frequencyFeatures } from './frequencyFeatures'
import { TECHNOLOGY_FEATURES, TECHNOLOGY_PROFILES } from './technologyProfiles'

const byId = new Map(frequencyFeatures.map(f => [f.id, f]))

describe('technology profiles merge', () => {
  it('applies every enrichment to a feature that actually exists', () => {
    // A renamed or removed feature id would silently drop its curated write-up, which is
    // exactly how the original technologies.json ended up orphaned in the first place.
    const missing = Object.keys(TECHNOLOGY_PROFILES).filter(id => !byId.has(id))
    expect(missing).toEqual([])
  })

  it('surfaces the governing standard on every enriched feature', () => {
    for (const [id, profile] of Object.entries(TECHNOLOGY_PROFILES)) {
      expect(byId.get(id)?.standard, id).toBe(profile.standard)
    }
  })

  it('uses the curated detail wherever one was supplied', () => {
    // Contains rather than equals: withModulationMetadata legitimately appends a
    // "Common modulation: …" sentence further down the pipeline.
    for (const [id, profile] of Object.entries(TECHNOLOGY_PROFILES)) {
      if (!profile.detail) continue
      expect(byId.get(id)?.detail, id).toContain(profile.detail)
    }
  })

  it('adds every new technology feature to the feature set', () => {
    for (const tech of TECHNOLOGY_FEATURES) {
      expect(byId.has(tech.id), tech.id).toBe(true)
    }
  })

  it('keeps feature ids unique after the merge', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const feature of frequencyFeatures) {
      if (seen.has(feature.id)) duplicates.push(feature.id)
      seen.add(feature.id)
    }
    expect(duplicates).toEqual([])
  })

  it('gives every new technology a positive frequency, bandwidth and a standard', () => {
    for (const tech of TECHNOLOGY_FEATURES) {
      expect(tech.frequency_center, tech.id).toBeGreaterThan(0)
      expect(tech.frequency_bandwidth, tech.id).toBeGreaterThan(0)
      expect(tech.standard, tech.id).toBeTruthy()
      expect(tech.detail.length, tech.id).toBeGreaterThan(80)
    }
  })

  it('covers the optical and ionizing lanes that had no technology markers', () => {
    // The point of the merge: professional mode drew nothing above the microwave lanes.
    const above = TECHNOLOGY_FEATURES.filter(t => t.frequency_center > 1e12)
    expect(above.length).toBeGreaterThanOrEqual(7)
  })
})
