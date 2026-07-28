import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'
import { PROFESSIONAL_SUB_BANDS, PROFESSIONAL_TECH_OVERLAYS } from '@/data/professionalSpectrum'
import { frequencyFeatures } from '@/data/frequencyFeatures'

it('writes the sweep manifest', () => {
  writeFileSync(
    'sweep-manifest.json',
    JSON.stringify({
      educational: EDUCATIONAL_EXAMPLES.map(e => ({
        id: e.id, label: e.label, frequency: e.frequency, confidence: e.confidence ?? null,
        claims: e.claims?.length ?? 0, sources: e.sources?.length ?? 0,
      })),
      pro: [
        ...PROFESSIONAL_SUB_BANDS.map(b => ({ id: b.id, label: b.label, kind: 'band' })),
        ...PROFESSIONAL_TECH_OVERLAYS.map(t => ({ id: t.id, label: t.label, kind: 'tech' })),
      ],
      features: frequencyFeatures.map(f => ({ id: f.id, label: f.label, frequency: f.frequency_center })),
    })
  )
})
