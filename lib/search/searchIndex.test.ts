import { describe, it, expect } from 'vitest'
import { search } from './searchIndex'

// The SearchBar useMemo drives its result list through search(); these lock the
// pipeline the component depends on (relevance-ranked match, keyword match,
// frequency parsing, empty-query short-circuit).
describe('search pipeline', () => {
  it('returns nothing for an empty / whitespace query', () => {
    expect(search('', [])).toEqual([])
    expect(search('   ', [])).toEqual([])
  })

  it('finds a distinctive entry by name', () => {
    const r = search('bluetooth', [])
    expect(r.length).toBeGreaterThan(0)
    expect(r.some(x => x.label.toLowerCase().includes('bluetooth'))).toBe(true)
  })

  it('ranks an exact-ish match above loose fuzzy matches (relevance sort)', () => {
    // Regression for the ranking fix: "MRI" must surface the MRI story near the
    // top, not be crowded out by fuzzy feature matches (Maritime, Military…).
    const r = search('MRI', [])
    expect(r.length).toBeGreaterThan(0)
    const mriIdx = r.findIndex(x => x.label.toLowerCase().includes('mri'))
    expect(mriIdx).toBeGreaterThanOrEqual(0)
    expect(mriIdx).toBeLessThan(3)
  })

  it('matches keywords across the corpus', () => {
    expect(search('whale', []).length).toBeGreaterThan(0)
    expect(search('laser', []).length).toBeGreaterThan(0)
  })

  it('parses a frequency query into a positioned result', () => {
    const r = search('2.45 GHz', [])
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].targetFrequency).toBeGreaterThan(0)
  })

  it('every result carries a positive target frequency and a non-empty label', () => {
    for (const r of search('radio', [])) {
      expect(r.targetFrequency).toBeGreaterThan(0)
      expect(r.label.length).toBeGreaterThan(0)
    }
  })
})
