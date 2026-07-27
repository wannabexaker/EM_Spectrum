import { describe, expect, it } from 'vitest'
import { placeWithOverflow } from './clusterPlacement'

interface Pin { x: number; id: string }

const pins = (...xs: number[]): Pin[] => xs.map((x, i) => ({ x, id: `p${i}` }))

describe('placeWithOverflow', () => {
  it('places nothing for an empty input', () => {
    const { placed, badges } = placeWithOverflow<Pin>([], 20)
    expect(placed).toEqual([])
    expect(badges).toEqual([])
  })

  it('places a lone marker without a badge', () => {
    const { placed, badges } = placeWithOverflow(pins(100), 20)
    expect(placed).toHaveLength(1)
    expect(badges).toHaveLength(0)
  })

  it('places every marker when all are further apart than minSpacing', () => {
    const { placed, badges } = placeWithOverflow(pins(0, 50, 100, 150), 20)
    expect(placed).toHaveLength(4)
    expect(badges).toHaveLength(0)
  })

  it('collapses markers closer than minSpacing into a single counted badge', () => {
    const { placed, badges } = placeWithOverflow(pins(100, 104, 108), 20)
    expect(placed).toHaveLength(1)
    expect(badges).toHaveLength(1)
    expect(badges[0].count).toBe(2)
    expect(badges[0].anchor.x).toBe(100)
  })

  it('never loses a marker — placed plus every badge count equals the input size', () => {
    const input = pins(0, 3, 6, 40, 42, 41, 300, 301, 302, 303, 900)
    const { placed, badges } = placeWithOverflow(input, 25)
    const counted = placed.length + badges.reduce((sum, b) => sum + b.count, 0)
    expect(counted).toBe(input.length)
  })

  it('anchors each badge to a marker that was actually placed', () => {
    const { placed, badges } = placeWithOverflow(pins(10, 12, 14, 200, 202), 30)
    for (const badge of badges) {
      expect(placed).toContain(badge.anchor)
    }
  })

  it('sorts unordered input before placing, so the leftmost marker anchors', () => {
    const { placed, badges } = placeWithOverflow(pins(108, 100, 104), 20)
    expect(placed[0].x).toBe(100)
    expect(badges[0].count).toBe(2)
  })

  it('reserves label width so wide labels push the next marker into overflow', () => {
    // Positions are 30px apart and minSpacing is 20, so without a width they all fit.
    const noWidth = placeWithOverflow(pins(0, 30, 60), 20)
    expect(noWidth.placed).toHaveLength(3)

    // A 40px-wide label makes the next marker fall inside the spacing window.
    const withWidth = placeWithOverflow(pins(0, 30, 60), 20, () => 40)
    expect(withWidth.placed).toHaveLength(2)
    expect(withWidth.badges.reduce((s, b) => s + b.count, 0)).toBe(1)
  })

  it('opens a new badge per cluster rather than merging distant clusters', () => {
    const { placed, badges } = placeWithOverflow(pins(0, 2, 4, 500, 502, 504), 20)
    expect(placed.map(p => p.x)).toEqual([0, 500])
    expect(badges).toHaveLength(2)
    expect(badges.map(b => b.count)).toEqual([2, 2])
  })
})
