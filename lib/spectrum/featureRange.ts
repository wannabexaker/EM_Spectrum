import { F_MIN } from '@/lib/zoom/logMapper'
import type { FrequencyFeature } from '@/types/spectrum'

/**
 * The band a feature actually occupies.
 *
 * Prefers the authored range. The linear fallback below is only for features that
 * never had one, and it is why the explicit range exists: frequency_center is a
 * GEOMETRIC centre, chosen so the pin lands in the visual middle of a log axis, but
 * `center - bandwidth / 2` is not its inverse. For a purring cat (25-150 Hz) that
 * arithmetic returns -1.3 Hz, which then clamped to F_MIN and rendered on the card
 * as "0.0100 pHz - 123.74 Hz" directly above prose saying "between about 25 and
 * 150 Hz". Every consumer that shows or matches a band goes through here.
 */
export function featureRange(feature: FrequencyFeature): { min: number; max: number } {
  if (feature.rangeMin !== undefined && feature.rangeMax !== undefined) {
    const min = Math.max(F_MIN, Math.min(feature.rangeMin, feature.rangeMax))
    return { min, max: Math.max(min, feature.rangeMax) }
  }
  const half = feature.frequency_bandwidth / 2
  const min = Math.max(F_MIN, feature.frequency_center - half)
  return { min, max: Math.max(min, feature.frequency_center + half) }
}
