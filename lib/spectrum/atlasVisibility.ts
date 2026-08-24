import type { ScientificConfidence, UniversalVibrationCategory } from '@/types/spectrum'

/**
 * Anything the Atlas filter governs. Educational stories and Universal Vibrations
 * Atlas features share the taxonomy, so they must share the predicate: two copies of
 * this rule can drift, and a filter that disagrees with itself about what is hidden
 * is indistinguishable from a filter that is simply broken.
 *
 * Kept free of data imports so both data modules and lib modules can use it without
 * an import cycle.
 */
export interface AtlasFilterable {
  atlasCategory?: UniversalVibrationCategory
  confidence?: ScientificConfidence
}

export function isAtlasItemVisible(
  item: AtlasFilterable,
  hiddenDomains: readonly UniversalVibrationCategory[],
  verifiedOnly: boolean,
): boolean {
  if (verifiedOnly && item.confidence !== 'Scientifically Verified') return false
  if (item.atlasCategory && hiddenDomains.includes(item.atlasCategory)) return false
  return true
}

/**
 * A feature answers to the Atlas filter only if it carries an atlasCategory.
 * Technology allocations and RF bands are outside that taxonomy and stay visible
 * whichever domains are hidden.
 */
export function isFeatureAtlasVisible(
  feature: AtlasFilterable,
  hiddenDomains: readonly UniversalVibrationCategory[],
  verifiedOnly: boolean,
): boolean {
  if (!feature.atlasCategory) return true
  return isAtlasItemVisible(feature, hiddenDomains, verifiedOnly)
}
