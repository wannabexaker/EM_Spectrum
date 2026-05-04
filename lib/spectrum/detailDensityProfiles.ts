import type { FrequencyFeature, SpectrumDetailDensity, SpectrumDetailLayers, SpectrumMode } from '@/types/spectrum'

export function getDetailDensityLayerPreset(density: SpectrumDetailDensity, mode: SpectrumMode): SpectrumDetailLayers {
  if (density === 'max') {
    return {
      pointsOfInterest: true,
      technologies: true,
      channels: true,
      regulations: true,
      hazards: true,
      natural: true,
    }
  }

  if (density === 'details') {
    return {
      pointsOfInterest: true,
      technologies: true,
      channels: true,
      regulations: mode === 'professional',
      hazards: true,
      natural: true,
    }
  }

  // clean / minimal
  return {
    pointsOfInterest: true,
    technologies: true,
    channels: false,
    regulations: mode === 'professional',
    hazards: false,
    natural: true,
  }
}

export function getFeatureZoomBoostForDensity(density: SpectrumDetailDensity, mode: SpectrumMode): number {
  if (density === 'clean') return mode === 'professional' ? 1.45 : 1.3
  if (density === 'max') return mode === 'professional' ? 0.3 : 0.36
  return 1
}

export function isFeatureInDensityScope(feature: FrequencyFeature, density: SpectrumDetailDensity): boolean {
  if (density === 'max') return true
  if (density === 'details') return true

  // Minimal mode keeps high-signal anchors only.
  return Boolean(feature.curatedRelations?.length) || feature.minZoom <= 4 || feature.confidence === 'Scientifically Verified'
}

export function getEducationalSpacingForDensity(density: SpectrumDetailDensity): number {
  if (density === 'clean') return 210
  if (density === 'max') return 72
  return 128
}

export function getProfessionalZoomBoostForDensity(density: SpectrumDetailDensity): number {
  if (density === 'clean') return 1.35
  if (density === 'max') return 0.42
  return 1
}

export function getProfessionalLabelSpacingForDensity(density: SpectrumDetailDensity): number {
  if (density === 'clean') return 152
  if (density === 'max') return 70
  return 96
}

export function getProfessionalVisibilityThresholdForDensity(density: SpectrumDetailDensity): number {
  if (density === 'clean') return 0.62
  if (density === 'max') return 0.2
  return 0.42
}

export function getDensitySummary(density: SpectrumDetailDensity, mode: SpectrumMode): string {
  if (density === 'clean') {
    return mode === 'professional'
      ? 'Minimal: core anchors and key technical references.'
      : 'Minimal: core anchors and essentials only.'
  }
  if (density === 'details') {
    return mode === 'professional'
      ? 'Balanced: richer context with controlled technical clutter.'
      : 'Balanced: more context with readable density.'
  }
  return mode === 'professional'
    ? 'Max: full technical overlays and dense relationships.'
    : 'Max: all visible points and relationships.'
}
