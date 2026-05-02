import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  FrequencyProbe,
  SpectrumBand,
  SpectrumDetailDensity,
  SpectrumDetailLayerKey,
  SpectrumDetailLayers,
  SpectrumMode,
} from '@/types/spectrum'

export const DEFAULT_DETAIL_LAYERS: SpectrumDetailLayers = {
  pointsOfInterest: true,
  technologies: true,
  channels: true,
  regulations: true,
  hazards: true,
  natural: true,
}

interface SpectrumStore {
  // Zoom state
  centerFrequency: number
  zoomLevel: number

  // UI state
  selectedBand: SpectrumBand | null
  isPanelOpen: boolean
  activeMode: SpectrumMode
  detailDensity: SpectrumDetailDensity
  detailLayers: SpectrumDetailLayers

  // Layer toggles
  showEM: boolean
  showSound: boolean
  showApplications: boolean
  showHazards: boolean

  // Unit preference
  displayUnit: 'frequency' | 'wavelength'

  // Live cursor probe
  probe: FrequencyProbe | null

  // Actions
  setZoom: (center: number, zoom: number) => void
  setProbe: (probe: FrequencyProbe | null) => void
  selectBand: (band: SpectrumBand | null) => void
  toggleLayer: (layer: 'EM' | 'sound' | 'applications' | 'hazards') => void
  toggleDetailLayer: (layer: SpectrumDetailLayerKey) => void
  setMode: (mode: SpectrumMode) => void
  setDetailDensity: (density: SpectrumDetailDensity) => void
  setDisplayUnit: (unit: 'frequency' | 'wavelength') => void
}

// createStore (vanilla) — gives us getInitialState() which useStore passes as
// getServerSnapshot. getInitialState() is frozen at creation → always same
// reference → stable across SSR calls → no React 19 "should be cached" error.
const spectrumVanillaStore = createStore<SpectrumStore>()(
  devtools(
    (set) => ({
      centerFrequency: 1e6,    // midpoint of the 1e-14 Hz -> 1e26 Hz master atlas range
      zoomLevel: 1,
      selectedBand: null,
      isPanelOpen: false,
      activeMode: 'educational',
      detailDensity: 'details',
      detailLayers: DEFAULT_DETAIL_LAYERS,
      showEM: true,
      showSound: true,
      showApplications: true,
      showHazards: true,
      displayUnit: 'frequency',
      probe: null,

      setZoom: (centerFrequency, zoomLevel) =>
        set({ centerFrequency, zoomLevel }),

      setProbe: (probe) => set({ probe }),

      selectBand: (band) =>
        set({ selectedBand: band, isPanelOpen: band !== null }),

      toggleLayer: (layer) =>
        set((s) => ({
          showEM:           layer === 'EM'           ? !s.showEM           : s.showEM,
          showSound:        layer === 'sound'        ? !s.showSound        : s.showSound,
          showApplications: layer === 'applications' ? !s.showApplications : s.showApplications,
          showHazards:      layer === 'hazards'      ? !s.showHazards      : s.showHazards,
        })),

      toggleDetailLayer: (layer) =>
        set((s) => ({
          detailLayers: {
            ...s.detailLayers,
            [layer]: !s.detailLayers[layer],
          },
        })),

      setMode: (mode) => set({ activeMode: mode }),
      setDetailDensity: (detailDensity) => set({ detailDensity }),

      setDisplayUnit: (unit) => set({ displayUnit: unit }),
    }),
    {
      name: 'spectrum-store',
      // Disable devtools during SSR and in production to prevent snapshot instability
      enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'development',
    }
  )
)

// Overloaded hook — supports both patterns:
//   useSpectrumStore()              → full SpectrumStore (for useZoom)
//   useSpectrumStore(s => s.showEM) → selected slice (for UI components)
function _useSpectrumStore(): SpectrumStore
function _useSpectrumStore<T>(selector: (state: SpectrumStore) => T): T
function _useSpectrumStore<T>(selector?: (state: SpectrumStore) => T): T | SpectrumStore {
  if (selector) return useStore(spectrumVanillaStore, selector)
  return useStore(spectrumVanillaStore)
}

// Attach getState for imperative access inside effects and callbacks
export const useSpectrumStore = Object.assign(_useSpectrumStore, {
  getState: (): SpectrumStore => spectrumVanillaStore.getState(),
})
