import { frequencyFeatures } from '@/data/frequencyFeatures'
import type { FeatureRelationType, FrequencyFeature } from '@/types/spectrum'

export interface RelatedFeature {
  feature: FrequencyFeature
  reason: FeatureRelationType | 'same-family' | 'same-atlas-category' | 'nearby-frequency'
  score: number
  curated: boolean
  note?: string
}

const MIN_FREQ = 1e-14
const FEATURE_BY_ID = new Map(frequencyFeatures.map(feature => [feature.id, feature]))

function logDistance(a: number, b: number): number {
  return Math.abs(Math.log10(Math.max(a, MIN_FREQ)) - Math.log10(Math.max(b, MIN_FREQ)))
}

function reasonFor(base: FrequencyFeature, candidate: FrequencyFeature): RelatedFeature['reason'] {
  if (base.family === candidate.family) return 'same-family'
  if (base.atlasCategory && base.atlasCategory === candidate.atlasCategory) return 'same-atlas-category'
  return 'nearby-frequency'
}

function scoreCandidate(base: FrequencyFeature, candidate: FrequencyFeature): number {
  const d = logDistance(base.frequency_center, candidate.frequency_center)
  let score = 0

  if (base.family === candidate.family) score += 5
  if (base.atlasCategory && base.atlasCategory === candidate.atlasCategory) score += 4
  if (base.category === candidate.category) score += 1
  if (base.confidence && candidate.confidence && base.confidence === candidate.confidence) score += 0.6

  // Prefer items in a nearby log-frequency neighborhood.
  if (d <= 1.2) {
    score += (1.2 - d) * 2.5
  }

  return score
}

export function findRelatedFeatures(base: FrequencyFeature, limit = 8): RelatedFeature[] {
  const curated: Array<{
    feature: FrequencyFeature
    reason: FeatureRelationType
    score: number
    curated: true
    note?: string
  }> = []

  for (const relation of base.curatedRelations ?? []) {
    const feature = FEATURE_BY_ID.get(relation.targetId)
    if (!feature || feature.id === base.id) continue
    curated.push({
      feature,
      reason: relation.type,
      score: 100 + Math.max(0, relation.weight ?? 0) * 10,
      curated: true,
      note: relation.note,
    })
  }

  const curatedIds = new Set(curated.map(item => item.feature.id))

  const heuristic = frequencyFeatures
    .filter(feature => feature.id !== base.id)
    .filter(feature => !curatedIds.has(feature.id))
    .map(feature => ({
      feature,
      score: scoreCandidate(base, feature),
      reason: reasonFor(base, feature),
      distance: logDistance(base.frequency_center, feature.frequency_center),
      curated: false,
      note: undefined,
    }))
    .filter(item => item.score >= 2)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.distance - b.distance
    })

  return [...curated, ...heuristic]
    .slice(0, limit)
    .map(({ feature, reason, score, curated, note }) => ({ feature, reason, score, curated, note }))
}

export function formatRelationshipReason(reason: RelatedFeature['reason']): string {
  const labels: Record<RelatedFeature['reason'], string> = {
    harmonic: 'Harmonic relation',
    'same-system': 'Same system',
    'shared-allocation': 'Shared allocation',
    'interference-risk': 'Interference context',
    'measurement-reference': 'Measurement reference',
    'adjacent-service': 'Adjacent service',
    'cross-domain-analogy': 'Cross-domain analogy',
    'same-family': 'Same family',
    'same-atlas-category': 'Same atlas category',
    'nearby-frequency': 'Nearby frequency',
  }
  return labels[reason]
}
