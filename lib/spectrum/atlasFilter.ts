import { EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import type { ScientificConfidence, UniversalVibrationCategory } from '@/types/spectrum'
import type { AtlasFilterable } from '@/lib/spectrum/atlasVisibility'

export { isAtlasItemVisible, isFeatureAtlasVisible } from '@/lib/spectrum/atlasVisibility'
export type { AtlasFilterable } from '@/lib/spectrum/atlasVisibility'

/** Everything the filter can act on, across both pools. */
const ATLAS_ITEMS: AtlasFilterable[] = [
  ...EDUCATIONAL_EXAMPLES,
  ...frequencyFeatures.filter(f => f.atlasCategory),
]

/**
 * Domains present across BOTH pools, most-populated first.
 * The filter previously counted educational stories only, so the entire Universal
 * Vibrations Atlas was uncountable and unhideable — the "Myths & claims" chip never
 * appeared at all, even though the label had been defined for it, and the lane was
 * reachable only by search or deep link.
 */
export const ATLAS_DOMAINS: ReadonlyArray<{ domain: UniversalVibrationCategory; count: number }> = (() => {
  const counts = new Map<UniversalVibrationCategory, number>()
  for (const item of ATLAS_ITEMS) {
    if (item.atlasCategory) counts.set(item.atlasCategory, (counts.get(item.atlasCategory) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
})()

/** Confidence levels actually present across both pools, with counts. */
export function atlasConfidenceCounts(order: readonly ScientificConfidence[]) {
  const counts = new Map<ScientificConfidence, number>()
  for (const item of ATLAS_ITEMS) {
    if (item.confidence) counts.set(item.confidence, (counts.get(item.confidence) ?? 0) + 1)
  }
  return order.filter(c => counts.has(c)).map(c => ({ level: c, count: counts.get(c)! }))
}
