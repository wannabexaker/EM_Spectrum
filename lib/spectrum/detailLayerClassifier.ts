import type { FrequencyFeature, SpectrumDetailLayerKey, SpectrumDetailLayers, SpectrumMode, UniversalVibrationCategory } from '@/types/spectrum'

export const DETAIL_LAYER_LABELS: Record<SpectrumDetailLayerKey, string> = {
  pointsOfInterest: 'Points of Interest',
  technologies: 'Technologies',
  channels: 'Channels',
  regulations: 'Regulations',
  hazards: 'Hazards',
  natural: 'Natural/Physics',
}

const REGULATION_RE = /\b(fcc|etsi|itu|ofcom|allocation|allocated|protected|legal|region|dfs|tpc|required|prohibited|licensed|unlicensed)\b/i
const CHANNEL_RE = /\b(channel|ch\d+|ch\s*\d+|ble\s+\d+|wifi.*ch|zigbee.*ch|unii)\b/i
const NATURAL_RE = /\b(schumann|hydrogen|astronomy|cosmic|earth|ionosphere|lightning|geophysical|natural|solar|galactic)\b/i
const HAZARD_RE = /\b(hazard|ionizing|x-ray|gamma|scanner|security|radar|power|mw|kw|thermal|biological|exposure)\b/i

const ATLAS_LAYER_MAP: Partial<Record<UniversalVibrationCategory, SpectrumDetailLayerKey[]>> = {
  physics: ['natural', 'pointsOfInterest'],
  'human-body': ['natural', 'pointsOfInterest'],
  animals: ['natural', 'pointsOfInterest'],
  nature: ['natural', 'pointsOfInterest'],
  plants: ['natural', 'pointsOfInterest'],
  'earth-planetary': ['natural', 'pointsOfInterest'],
  astronomy: ['natural', 'pointsOfInterest'],
  technology: ['technologies', 'pointsOfInterest'],
  transport: ['technologies', 'pointsOfInterest'],
  civilization: ['technologies', 'pointsOfInterest'],
  music: ['natural', 'pointsOfInterest'],
  'danger-safety': ['hazards', 'pointsOfInterest'],
  'myths-claims': ['pointsOfInterest'],
}

export function classifyFeature(feature: FrequencyFeature): SpectrumDetailLayerKey[] {
  const haystack = `${feature.id} ${feature.label} ${feature.shortLabel} ${feature.family} ${feature.detail}`
  const layers = new Set<SpectrumDetailLayerKey>()

  layers.add('pointsOfInterest')

  if (feature.atlasCategory) {
    for (const layer of ATLAS_LAYER_MAP[feature.atlasCategory] ?? []) {
      layers.add(layer)
    }
  }

  if (feature.category === 'technology') layers.add('technologies')
  if (CHANNEL_RE.test(haystack)) layers.add('channels')
  if (REGULATION_RE.test(haystack)) layers.add('regulations')
  if (HAZARD_RE.test(haystack)) layers.add('hazards')
  if (NATURAL_RE.test(haystack)) layers.add('natural')

  return Array.from(layers)
}

export function isFeatureAllowedByDetailLayers(feature: FrequencyFeature, layers: SpectrumDetailLayers): boolean {
  return classifyFeature(feature).some(layer => layers[layer])
}

export function disabledDetailLayersForFeature(feature: FrequencyFeature, layers: SpectrumDetailLayers): SpectrumDetailLayerKey[] {
  return classifyFeature(feature).filter(layer => !layers[layer])
}

export function isFeatureVisibleInMode(feature: FrequencyFeature, mode: SpectrumMode): boolean {
  return !feature.modeVisibility || feature.modeVisibility === 'both' || feature.modeVisibility === mode
}
