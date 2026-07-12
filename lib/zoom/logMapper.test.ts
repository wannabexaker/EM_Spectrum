import { describe, it, expect } from 'vitest'
import {
  freqToScreenX,
  screenXToFreq,
  clampFrequency,
  clampZoom,
  formatFrequency,
  F_MIN,
  F_MAX,
  MIN_ZOOM,
  MAX_ZOOM,
} from './logMapper'

const W = 1000

describe('freqToScreenX', () => {
  it('places the center frequency at the horizontal midpoint', () => {
    expect(freqToScreenX(1e6, W, 1e6, 1)).toBeCloseTo(W / 2, 6)
  })

  it('maps one decade above center to the expected offset (logSpan = 40 at zoom 1)', () => {
    // 3 decades above center → 3/40 of the width right of midpoint
    expect(freqToScreenX(1e9, W, 1e6, 1)).toBeCloseTo(0.575 * W, 6)
  })
})

describe('screenXToFreq / freqToScreenX round-trip', () => {
  for (const f of [1e-10, 1, 50, 1e6, 1.42e9, 5.55e14, 3e20]) {
    it(`recovers ${f.toExponential()} Hz`, () => {
      const x = freqToScreenX(f, W, 1e6, 3)
      const back = screenXToFreq(x, W, 1e6, 3)
      expect(back).toBeGreaterThan(f * 0.999999)
      expect(back).toBeLessThan(f * 1.000001)
    })
  }
})

describe('clampFrequency / clampZoom', () => {
  it('clamps frequency into [F_MIN, F_MAX]', () => {
    expect(clampFrequency(1e-30)).toBe(F_MIN)
    expect(clampFrequency(1e40)).toBe(F_MAX)
    expect(clampFrequency(1e6)).toBe(1e6)
  })
  it('clamps zoom into [MIN_ZOOM, MAX_ZOOM]', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(1e9)).toBe(MAX_ZOOM)
  })
})

describe('formatFrequency', () => {
  it('uses SI-prefixed units', () => {
    expect(formatFrequency(1e6)).toBe('1.00 MHz')
    expect(formatFrequency(2.45e9)).toBe('2.45 GHz')
    expect(formatFrequency(100)).toBe('100.00 Hz')
    expect(formatFrequency(7.83)).toBe('7.83 Hz')
  })
  it('handles sub-Hz cycles', () => {
    expect(formatFrequency(5e-3)).toContain('mHz')
    expect(formatFrequency(5e-5)).toContain('uHz')
    expect(formatFrequency(2e-7)).toContain('nHz')
  })
})
