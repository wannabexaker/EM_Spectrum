import { F_MIN } from '@/lib/zoom/logMapper'
import type { SpectrumBand, SpectrumCategory, FrequencyFeature } from '@/types/spectrum'

export interface SpectrumLane {
  id: SpectrumCategory
  y: number
  label: string
  range: string
  frequencyMin: number
  frequencyMax: number
  color: string
  pixiColor: number
}

export const SPECTRUM_LANES: SpectrumLane[] = [
  { id: 'radio', y: 0.11, label: 'Radio', range: '3 Hz-3 GHz', frequencyMin: 3, frequencyMax: 3e9, color: '#00d4ff', pixiColor: 0x00d4ff },
  { id: 'microwave', y: 0.23, label: 'Microwave', range: '3 GHz-3 THz', frequencyMin: 3e9, frequencyMax: 3e12, color: '#00ff88', pixiColor: 0x00ff88 },
  { id: 'infrared', y: 0.35, label: 'Infrared', range: '3-430 THz', frequencyMin: 3e12, frequencyMax: 4.3e14, color: '#ff6b35', pixiColor: 0xff6b35 },
  { id: 'visible', y: 0.47, label: 'Visible light', range: '400-790 THz', frequencyMin: 4e14, frequencyMax: 7.9e14, color: '#ffffff', pixiColor: 0xffffff },
  { id: 'ultraviolet', y: 0.59, label: 'Ultraviolet', range: '0.75-30 PHz', frequencyMin: 7.5e14, frequencyMax: 3e16, color: '#c77dff', pixiColor: 0xc77dff },
  { id: 'xray', y: 0.71, label: 'X-ray', range: '30 PHz-300 EHz', frequencyMin: 3e16, frequencyMax: 3e20, color: '#4cc9f0', pixiColor: 0x4cc9f0 },
  { id: 'gamma', y: 0.82, label: 'Gamma', range: '>30 EHz', frequencyMin: 3e19, frequencyMax: 1e26, color: '#ff006e', pixiColor: 0xff006e },
  { id: 'sound', y: 0.92, label: 'Audio / mechanical', range: 'cosmic cycles-200 MHz', frequencyMin: F_MIN, frequencyMax: 2e8, color: '#ffd60a', pixiColor: 0xffd60a },
]

export const SPECTRUM_LANE_BY_ID = SPECTRUM_LANES.reduce(
  (acc, lane) => {
    acc[lane.id] = lane
    return acc
  },
  {} as Record<SpectrumCategory, SpectrumLane>
)

export function getBandLane(band: SpectrumBand): SpectrumLane {
  return SPECTRUM_LANE_BY_ID[band.category] ?? SPECTRUM_LANE_BY_ID.radio
}

export function getFeatureLane(feature: FrequencyFeature, bands: SpectrumBand[]): SpectrumLane {
  if (feature.category !== 'technology') {
    return SPECTRUM_LANE_BY_ID[feature.category] ?? SPECTRUM_LANE_BY_ID.radio
  }

  const parentBand = bands.find(
    band =>
      !band.is_sound_overlay &&
      feature.frequency_center >= band.frequency_min &&
      feature.frequency_center <= band.frequency_max
  )

  return parentBand ? getBandLane(parentBand) : SPECTRUM_LANE_BY_ID.radio
}
