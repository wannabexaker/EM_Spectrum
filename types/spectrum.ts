export type IonizationType = 'ionizing' | 'non-ionizing'
export type LODLevel = 0 | 1 | 2 | 3
export type SpectrumMode = 'educational' | 'professional'
export type SpectrumDetailDensity = 'clean' | 'details' | 'max'

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

export interface TechnologyOverlay {
  id: string
  label: string
  frequency_center: number
  frequency_bandwidth: number
  standard?: string
  description: string
  band_id: string
  icon?: string
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
}

export interface FrequencyProbe {
  frequency: number
  wavelength: number
  x: number
  y: number
  label?: string
  detail?: string
  family?: string
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
