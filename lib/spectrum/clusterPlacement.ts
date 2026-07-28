/**
 * Greedy left→right placement with overflow accounting.
 *
 * Every marker layer on the canvas faces the same problem: at low zoom many markers
 * land within a few pixels of each other. Drawing them all produces an unreadable pile;
 * dropping the extras silently is worse, because the view then lies about how much is
 * there. So we place what fits and report the rest as a count, which the renderer draws
 * as a clickable "+N" badge.
 *
 * Pure and independent of PixiJS so the placement maths can be unit-tested.
 */

export interface PlacedItem {
  /** Screen-space x of the marker. */
  x: number
}

/** Drawn height of a "+N" badge. */
export const CLUSTER_BADGE_HEIGHT = 14

/**
 * Screen-space box of a "+N" badge, given the marker it sits next to.
 *
 * The renderer draws the badge from this and publishes the same box for the hit-test, so
 * the two cannot drift apart — a badge you can see but not click (or the reverse) would be
 * invisible to unit tests and easy to introduce by editing one of the two places.
 */
export function clusterBadgeBox(anchorX: number, badgeY: number, count: number) {
  return {
    bx: anchorX + 9,
    by: badgeY,
    w: 14 + String(count).length * 6,
    h: CLUSTER_BADGE_HEIGHT,
  }
}

export interface OverflowBadge<T> {
  /** The placed marker the badge is drawn next to. */
  anchor: T
  /** How many markers collapsed into this badge. */
  count: number
}

export interface PlacementResult<T> {
  placed: T[]
  badges: Array<OverflowBadge<T>>
}

/**
 * @param items      Markers to place; may be unsorted.
 * @param minSpacing Minimum x-gap required between a marker and the previous one's right edge.
 * @param widthOf    Horizontal room a placed marker occupies (label width). Defaults to 0,
 *                   which spaces purely on marker positions.
 */
export function placeWithOverflow<T extends PlacedItem>(
  items: T[],
  minSpacing: number,
  widthOf: (item: T) => number = () => 0
): PlacementResult<T> {
  const sorted = [...items].sort((a, b) => a.x - b.x)
  const placed: T[] = []
  const badges: Array<OverflowBadge<T>> = []

  let lastRight = -Infinity
  let overflow = 0
  let anchor: T | null = null

  // Resolve the pending overflow against the marker it accumulated behind, so the badge
  // always sits next to something visible.
  const flush = () => {
    if (overflow > 0 && anchor) {
      badges.push({ anchor, count: overflow })
      overflow = 0
    }
  }

  for (const item of sorted) {
    if (item.x - lastRight < minSpacing) {
      overflow++
      continue
    }
    flush()
    placed.push(item)
    lastRight = item.x + widthOf(item)
    anchor = item
  }
  flush() // trailing overflow after the last placed marker

  return { placed, badges }
}
