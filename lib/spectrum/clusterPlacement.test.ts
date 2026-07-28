import { describe, expect, it } from 'vitest'
import { CLUSTER_BADGE_HEIGHT, clusterBadgeBox, placeWithOverflow } from './clusterPlacement'

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

describe('clusterBadgeBox', () => {
  it('sits clear of the marker it annotates', () => {
    const box = clusterBadgeBox(100, 50, 3)
    expect(box.bx).toBeGreaterThan(100)
    expect(box.by).toBe(50)
    expect(box.h).toBe(CLUSTER_BADGE_HEIGHT)
  })

  it('widens for larger counts so the label cannot overflow its pill', () => {
    const two = clusterBadgeBox(0, 0, 9).w
    const three = clusterBadgeBox(0, 0, 12).w
    const four = clusterBadgeBox(0, 0, 140).w
    expect(three).toBeGreaterThan(two)
    expect(four).toBeGreaterThan(three)
  })

  it('describes a box that a click at its centre lands inside', () => {
    // Mirrors the canvas hit-test: x within [bx, bx + w], y within half the height.
    const box = clusterBadgeBox(240, 90, 16)
    const cx = box.bx + box.w / 2
    const cy = box.by
    expect(cx >= box.bx && cx <= box.bx + box.w).toBe(true)
    expect(Math.abs(cy - box.by) < box.h / 2 + 2).toBe(true)
  })

  it('is deterministic — the drawn pill and the published hit-box come from one call', () => {
    expect(clusterBadgeBox(17, 33, 7)).toEqual(clusterBadgeBox(17, 33, 7))
  })
})
