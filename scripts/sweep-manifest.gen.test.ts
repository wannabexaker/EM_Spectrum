import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'
import { PROFESSIONAL_SUB_BANDS, PROFESSIONAL_TECH_OVERLAYS } from '@/data/professionalSpectrum'
import { frequencyFeatures } from '@/data/frequencyFeatures'

/**
 * Writes the fixture `npm run sweep` compares the live UI against, and asserts the
 * catalogue is actually populated while doing it — a sweep run against an empty manifest
 * would report a clean pass having opened nothing, which is exactly the trap the data
 * validator had silently fallen into.
 */
const manifest = {
  educational: EDUCATIONAL_EXAMPLES.map(e => ({
    id: e.id, label: e.label, frequency: e.frequency, confidence: e.confidence ?? null,
  })),
  pro: [
    ...PROFESSIONAL_SUB_BANDS.map(b => ({ id: b.id, label: b.label, kind: 'band' as const })),
    ...PROFESSIONAL_TECH_OVERLAYS.map(t => ({ id: t.id, label: t.label, kind: 'tech' as const })),
  ],
  features: frequencyFeatures.map(f => ({
    id: f.id, label: f.label, frequency: f.frequency_center,
  })),
}

describe('sweep manifest', () => {
  it('covers a populated catalogue', () => {
    expect(manifest.educational.length).toBeGreaterThanOrEqual(100)
    expect(manifest.pro.length).toBeGreaterThanOrEqual(50)
    expect(manifest.features.length).toBeGreaterThanOrEqual(200)
  })

  it('gives every entry an id and a label to match the rendered panel against', () => {
    for (const group of [manifest.educational, manifest.pro, manifest.features]) {
      for (const entry of group) {
        expect(entry.id, JSON.stringify(entry)).toBeTruthy()
        expect(entry.label, entry.id).toBeTruthy()
      }
    }
  })

  it('keeps ids unique within each group, so a match cannot be ambiguous', () => {
    for (const group of [manifest.educational, manifest.pro, manifest.features]) {
      expect(new Set(group.map(e => e.id)).size).toBe(group.length)
    }
  })

  it('writes the fixture', () => {
    writeFileSync('sweep-manifest.json', JSON.stringify(manifest))
  })
})
