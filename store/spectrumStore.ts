import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getDetailDensityLayerPreset } from '@/lib/spectrum/detailDensityProfiles'
import type {
  FrequencyProbe,
  RegulatoryRegion,
  SearchScope,
  SpectrumBand,
  SpectrumCategory,
  SpectrumDetailDensity,
  SpectrumDetailLayerKey,
  SpectrumDetailLayers,
  SpectrumMode,
  UniversalVibrationCategory,
} from '@/types/spectrum'

export const DEFAULT_DETAIL_LAYERS: SpectrumDetailLayers = {
  pointsOfInterest: true,
  technologies: true,
  channels: true,
  regulations: true,
  hazards: true,
  natural: true,
}

const LOCAL_STORAGE_KEYS = {
  favorites: 'em-spectrum:favorites:v1',
  favoriteBands: 'em-spectrum:favorite-bands:v1',
  regulatoryRegion: 'em-spectrum:regulatory-region:v1',
  searchScope: 'em-spectrum:search-scope:v1',
  cursorFrequency: 'em-spectrum:cursor-frequency:v1',
} as const

function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore storage failures in privacy mode or restricted environments.
  }
}

function parseFavoriteIds(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((item): item is string => typeof item === 'string' && item.length > 0))]
  } catch {
    return []
  }
}

function parseRegulatoryRegion(raw: string | null): RegulatoryRegion {
  return raw === 'eu' || raw === 'us' || raw === 'japan' ? raw : 'all'
}

function parseSearchScope(raw: string | null): SearchScope {
  return raw === 'rf' ? 'rf' : 'all'
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
  selectedFeatureId: string | null
  focusedLaneId: SpectrumCategory | null
  selectedLaneId: SpectrumCategory | null

  // Layer toggles
  showEM: boolean
  showSound: boolean
  showApplications: boolean
  showHazards: boolean

  // Educational atlas filters (domain axis + rigour gate)
  eduHiddenDomains: UniversalVibrationCategory[]
  eduVerifiedOnly: boolean

  // Cross-component request to open a specific educational story popup (e.g. from search).
  pendingEduStoryId: string | null
  // Same, for RF/atlas feature cards and professional markers (ITU sub-bands, tech
  // allocations) — search picks used to only re-centre without opening anything.
  pendingFeatureId: string | null
  pendingProId: string | null

  // Unit preference
  displayUnit: 'frequency' | 'wavelength'

  // Live cursor probe
  probe: FrequencyProbe | null
  showCursorFrequency: boolean

  // Local user preferences
  favoriteFeatureIds: string[]
  favoriteBandIds: string[]
  regulatoryRegion: RegulatoryRegion
  searchScope: SearchScope

  // Actions
  hydrateLocalPreferences: () => void
  setZoom: (center: number, zoom: number) => void
  setProbe: (probe: FrequencyProbe | null) => void
  selectBand: (band: SpectrumBand | null) => void
  setSelectedFeature: (id: string | null) => void
  setFocusedLane: (lane: SpectrumCategory | null) => void
  setSelectedLane: (lane: SpectrumCategory | null) => void
  toggleLayer: (layer: 'EM' | 'sound' | 'applications' | 'hazards') => void
  toggleDetailLayer: (layer: SpectrumDetailLayerKey) => void
  toggleEduDomain: (domain: UniversalVibrationCategory) => void
  toggleEduVerifiedOnly: () => void
  resetEduFilters: () => void
  openEducationalStory: (id: string | null) => void
  openFeatureCard: (id: string | null) => void
  openProCard: (id: string | null) => void
  setMode: (mode: SpectrumMode) => void
  setDetailDensity: (density: SpectrumDetailDensity) => void
  setDisplayUnit: (unit: 'frequency' | 'wavelength') => void
  toggleCursorFrequency: () => void
  toggleFavoriteFeature: (id: string) => void
  toggleFavoriteBand: (id: string) => void
  setRegulatoryRegion: (region: RegulatoryRegion) => void
  setSearchScope: (scope: SearchScope) => void
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
      selectedFeatureId: null,
      focusedLaneId: null,
      selectedLaneId: null,
      showEM: true,
      showSound: true,
      showApplications: true,
      showHazards: true,
      eduHiddenDomains: [],
      eduVerifiedOnly: false,
      pendingEduStoryId: null,
      pendingFeatureId: null,
      pendingProId: null,
      displayUnit: 'frequency',
      probe: null,
      showCursorFrequency: true,
      favoriteFeatureIds: [],
      favoriteBandIds: [],
      regulatoryRegion: 'all',
      searchScope: 'all',

      hydrateLocalPreferences: () =>
        set({
          favoriteFeatureIds: parseFavoriteIds(readLocalStorage(LOCAL_STORAGE_KEYS.favorites)),
          favoriteBandIds: parseFavoriteIds(readLocalStorage(LOCAL_STORAGE_KEYS.favoriteBands)),
          regulatoryRegion: parseRegulatoryRegion(readLocalStorage(LOCAL_STORAGE_KEYS.regulatoryRegion)),
          searchScope: parseSearchScope(readLocalStorage(LOCAL_STORAGE_KEYS.searchScope)),
          showCursorFrequency: readLocalStorage(LOCAL_STORAGE_KEYS.cursorFrequency) === 'false' ? false : true,
        }),

      setZoom: (centerFrequency, zoomLevel) =>
        set({ centerFrequency, zoomLevel }),

      setProbe: (probe) => set({ probe }),

      selectBand: (band) =>
        set({ selectedBand: band, isPanelOpen: band !== null }),

      setSelectedFeature: (selectedFeatureId) => set({ selectedFeatureId }),
      setFocusedLane: (focusedLaneId) => set({ focusedLaneId }),
      setSelectedLane: (selectedLaneId) => set({ selectedLaneId }),

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

      toggleEduDomain: (domain) =>
        set((s) => ({
          eduHiddenDomains: s.eduHiddenDomains.includes(domain)
            ? s.eduHiddenDomains.filter(d => d !== domain)
            : [...s.eduHiddenDomains, domain],
        })),
      toggleEduVerifiedOnly: () => set((s) => ({ eduVerifiedOnly: !s.eduVerifiedOnly })),
      resetEduFilters: () => set({ eduHiddenDomains: [], eduVerifiedOnly: false }),
      openEducationalStory: (id) => set({ pendingEduStoryId: id }),
      openFeatureCard: (id) => set({ pendingFeatureId: id }),
      openProCard: (id) => set({ pendingProId: id }),

      setMode: (mode) =>
        set((s) => ({
          activeMode: mode,
          detailLayers: getDetailDensityLayerPreset(s.detailDensity, mode),
        })),
      setDetailDensity: (detailDensity) =>
        set((s) => ({
          detailDensity,
          detailLayers: getDetailDensityLayerPreset(detailDensity, s.activeMode),
        })),

      setDisplayUnit: (unit) => set({ displayUnit: unit }),
      toggleCursorFrequency: () =>
        set((s) => {
          const next = !s.showCursorFrequency
          writeLocalStorage(LOCAL_STORAGE_KEYS.cursorFrequency, String(next))
          return { showCursorFrequency: next }
        }),

      toggleFavoriteFeature: (id) =>
        set((s) => {
          const exists = s.favoriteFeatureIds.includes(id)
          const favoriteFeatureIds = exists
            ? s.favoriteFeatureIds.filter(item => item !== id)
            : [...s.favoriteFeatureIds, id]
          writeLocalStorage(LOCAL_STORAGE_KEYS.favorites, JSON.stringify(favoriteFeatureIds))
          return { favoriteFeatureIds }
        }),

      toggleFavoriteBand: (id) =>
        set((s) => {
          const exists = s.favoriteBandIds.includes(id)
          const favoriteBandIds = exists
            ? s.favoriteBandIds.filter(item => item !== id)
            : [...s.favoriteBandIds, id]
          writeLocalStorage(LOCAL_STORAGE_KEYS.favoriteBands, JSON.stringify(favoriteBandIds))
          return { favoriteBandIds }
        }),

      setRegulatoryRegion: (regulatoryRegion) => {
        writeLocalStorage(LOCAL_STORAGE_KEYS.regulatoryRegion, regulatoryRegion)
        set({ regulatoryRegion })
      },

      setSearchScope: (searchScope) => {
        writeLocalStorage(LOCAL_STORAGE_KEYS.searchScope, searchScope)
        set({ searchScope })
      },
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
