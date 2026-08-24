import { describe, it, expect } from 'vitest'
import { universalVibrationFeatures } from '@/data/universalVibrationsAtlas'
import { featureRange } from '@/lib/spectrum/featureRange'
import { F_MIN } from '@/lib/zoom/logMapper'

describe('featureRange', () => {
  it('reports the authored band, not a linear re-derivation', () => {
    // The regression this guards: frequency_center is a geometric centre, so
    // center - bandwidth/2 went negative and the card rendered "0.0100 pHz".
    const purr = universalVibrationFeatures.find(f => f.id === 'atlas-cat-purr')!
    expect(featureRange(purr)).toEqual({ min: 25, max: 150 })

    const bat = universalVibrationFeatures.find(f => f.id === 'atlas-bat-echolocation')!
    expect(featureRange(bat)).toEqual({ min: 20_000, max: 120_000 })
  })

  it('never clamps an audible-or-higher phenomenon down to F_MIN', () => {
    const clamped = universalVibrationFeatures
      .filter(f => f.frequency_center > 1 && featureRange(f).min <= F_MIN * 10)
      .map(f => f.id)
    expect(clamped).toEqual([])
  })

  it('keeps every range ordered and inside its own centre-plus-bandwidth envelope', () => {
    for (const f of universalVibrationFeatures) {
      const { min, max } = featureRange(f)
      expect(min).toBeGreaterThan(0)
      expect(max).toBeGreaterThanOrEqual(min)
      if (f.rangeMin !== undefined) {
        expect(min).toBeLessThanOrEqual(f.frequency_center)
        expect(max).toBeGreaterThanOrEqual(f.frequency_center)
      }
    }
  })

  it('covers the myth claims with their stated bands', () => {
    const expected: Record<string, [number, number]> = {
      'atlas-claim-consciousness-hz': [20, 1000],
      'atlas-claim-solfeggio': [174, 963],
      'atlas-claim-rife-mor': [1e5, 2e7],
      'atlas-claim-body-mhz': [62e6, 78e6],
    }
    for (const [id, [min, max]] of Object.entries(expected)) {
      const f = universalVibrationFeatures.find(x => x.id === id)
      expect(f, `${id} missing from the atlas`).toBeDefined()
      expect(featureRange(f!)).toEqual({ min, max })
    }
  })
})
