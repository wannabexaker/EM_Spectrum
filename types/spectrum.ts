export type IonizationType = 'ionizing' | 'non-ionizing'
export type LODLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type SpectrumMode = 'educational' | 'professional'
export type SpectrumDetailDensity = 'clean' | 'details' | 'max'
export type RegulatoryRegion = 'all' | 'eu' | 'us' | 'japan'
export type SearchScope = 'all' | 'rf'
export type ScientificConfidence =
  | 'Scientifically Verified'
  | 'Strong Evidence'
  | 'Estimated / Approximate'
  | 'Theoretical'
  | 'Anecdotal'
  | 'Folklore / Cultural Claim'
  | 'Pseudoscience / Unsupported'
  | 'Unknown / Needs Validation'

export type FeatureRelationType =
  | 'harmonic'
  | 'same-system'
  | 'shared-allocation'
  | 'interference-risk'
  | 'measurement-reference'
  | 'adjacent-service'
  | 'cross-domain-analogy'

export interface FeatureRelation {
  targetId: string
  type: FeatureRelationType
  note?: string
  weight?: number
  confidence?: ScientificConfidence
}

export interface FrequencyRegulatoryNote {
  region: string
  range?: string
  limit: string
  conditions?: string
  source?: {
    label: string
    url?: string
  }
}

export type UniversalVibrationCategory =
  | 'physics'
  | 'human-body'
  | 'animals'
  | 'nature'
  | 'plants'
  | 'earth-planetary'
  | 'astronomy'
  | 'technology'
  | 'transport'
  | 'civilization'
  | 'music'
  | 'danger-safety'
  | 'myths-claims'

export type SpectrumDetailLayerKey =
  | 'pointsOfInterest'
  | 'technologies'
  | 'channels'
  | 'regulations'
  | 'hazards'
  | 'natural'

export type SpectrumDetailLayers = Record<SpectrumDetailLayerKey, boolean>

export type SpectrumCategory =
  | 'radio'
  | 'microwave'
  | 'infrared'
  | 'visible'
  | 'ultraviolet'
  | 'xray'
  | 'gamma'
  | 'sound'

export interface SpectrumBand {
  id: string
  frequency_min: number
  frequency_max: number
  wavelength_min: number
  wavelength_max: number
  category: SpectrumCategory
  subcategory: string
  label: string
  description: string
  interactions: string[]
  applications: string[]
  hazards: string[]
  ionization_type: IonizationType
  sources: string[]
  visualization_color: string
  lod_level: LODLevel
  is_sound_overlay: boolean
}

export interface FrequencyFeature {
  id: string
  label: string
  shortLabel: string
  frequency_center: number
  frequency_bandwidth: number
  category: SpectrumCategory | 'technology'
  family: string
  detail: string
  color: string
  minZoom: number
  aliases?: string[]
  atlasCategory?: UniversalVibrationCategory
  /** Governing standard, e.g. "IEEE 802.11ax" / "IS-GPS-200" — shown as a tag. */
  standard?: string
  confidence?: ScientificConfidence
  sources?: Array<{
    label: string
    url?: string
    note?: string
  }>
  /**
   * The authored extent of the phenomenon, when it has one. Kept explicitly because
   * frequency_center is a geometric centre (correct for placing a pin on a log axis)
   * while a linear center +/- bandwidth/2 is not its inverse: for 25-150 Hz that
   * arithmetic yields a NEGATIVE lower bound, which the card then clamped to F_MIN
   * and displayed as "0.0100 pHz". Consumers should prefer these over deriving.
   */
  rangeMin?: number
  rangeMax?: number
  periodSeconds?: number
  modulationTypes?: string[]
  modeVisibility?: SpectrumMode | 'both'
  listPath?: string[]
  curatedRelations?: FeatureRelation[]
  regulatory?: FrequencyRegulatoryNote[]
}

export interface FrequencyProbe {
  frequency: number
  wavelength: number
  x: number
  y: number
  label?: string
  detail?: string
  family?: string
  modulation?: string
}

export interface ZoomState {
  centerFrequency: number
  zoomLevel: number
  lodLevel: LODLevel
}

export interface ViewportDimensions {
  width: number
  height: number
  pixelRatio: number
}
