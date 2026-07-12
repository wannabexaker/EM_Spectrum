'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { search, type SearchResult } from '@/lib/search/searchIndex'
import { classifyFeature, disabledDetailLayersForFeature, DETAIL_LAYER_LABELS } from '@/lib/spectrum/detailLayerClassifier'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { findRelatedFeatures } from '@/lib/spectrum/featureRelationships'
import type { FrequencyFeature, SearchScope, SpectrumBand, SpectrumDetailDensity, SpectrumDetailLayerKey } from '@/types/spectrum'

interface SearchBarProps {
  onBandSelect?: (band: SpectrumBand) => void
}

const MODULATION_FACETS = ['All', 'OFDM', 'QPSK', 'FSK', 'FMCW', 'GFSK', 'AM', 'FM'] as const
type ModulationFacet = typeof MODULATION_FACETS[number]
const SIGNAL_CLASS_FACETS = ['All', 'Digital', 'Analog', 'Hybrid'] as const
type SignalClassFacet = typeof SIGNAL_CLASS_FACETS[number]

const ANALOG_MOD_TOKENS = ['am', 'fm', 'cw', 'usb', 'lsb']
const DIGITAL_MOD_TOKENS = ['ofdm', 'ofdma', 'qpsk', 'psk', 'fsk', 'gfsk', 'gmsk', 'qam', 'ask', 'dsss', 'css', 'fmcw', 'boc']

function modulationSignalClass(modulationTypes?: string[]): SignalClassFacet {
  if (!modulationTypes || modulationTypes.length === 0) return 'All'

  const tokens = modulationTypes.map(item => item.toLowerCase())
  const hasDigital = tokens.some(item => DIGITAL_MOD_TOKENS.some(token => item.includes(token)))
  const hasAnalog = tokens.some(item => ANALOG_MOD_TOKENS.some(token => item.includes(token)))

  if (hasDigital && hasAnalog) return 'Hybrid'
  if (hasDigital) return 'Digital'
  if (hasAnalog) return 'Analog'
  return 'All'
}

const EMPTY_MODULATION_COUNTS: Record<ModulationFacet, number> = {
  All: 0,
  OFDM: 0,
  QPSK: 0,
  FSK: 0,
  FMCW: 0,
  GFSK: 0,
  AM: 0,
  FM: 0,
}

const EMPTY_SIGNAL_COUNTS: Record<SignalClassFacet, number> = {
  All: 0,
  Digital: 0,
  Analog: 0,
  Hybrid: 0,
}

const FEATURE_BY_ID = new Map(frequencyFeatures.map(feature => [feature.id, feature]))

const SEARCH_SCOPE_OPTIONS: Array<{ value: SearchScope; label: string; title: string }> = [
  { value: 'all', label: 'All results', title: 'Search the full atlas, education examples, bands and technologies' },
  { value: 'rf', label: 'RF only', title: 'Limit results to EM bands and technology/channel features' },
]

function buildFeatureSearchResult(feature: FrequencyFeature, context: string): SearchResult {
  return {
    type: feature.atlasCategory ? 'atlas' : 'technology',
    label: feature.label,
    sublabel: `${context} - ${feature.family}`,
    targetFrequency: feature.frequency_center,
    targetZoom: Math.max(8, feature.minZoom * 1.15),
    data: feature,
  }
}

function buildRelatedSearchResults(base: FrequencyFeature): SearchResult[] {
  return findRelatedFeatures(base, 7).map(rel => ({
    type: rel.feature.atlasCategory ? 'atlas' : 'technology',
    label: rel.feature.label,
    sublabel: `Related · ${rel.feature.family}`,
    targetFrequency: rel.feature.frequency_center,
    targetZoom: Math.max(8, rel.feature.minZoom * 1.15),
    data: rel.feature,
  }))
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.+-]+/g, ' ').trim()
}

function isNumericSearchQuery(query: string): boolean {
  return /^[\d.,e+\-\s]+(?:hz|khz|mhz|ghz|thz|m|cm|mm|um|nm|pm|fm|bpm|rpm)?$/i.test(query.trim())
}

function resultId(result: SearchResult): string {
  return String(result.data.id)
}

function resultTextPriority(result: SearchResult, query: string): number {
  const q = normalizeSearchText(query)
  if (!q) return 0

  const label = normalizeSearchText(result.label)
  const sublabel = normalizeSearchText(result.sublabel)
  const texts = [label, sublabel]

  if (result.type !== 'band' && result.type !== 'educational') {
    const feature = result.data as FrequencyFeature
    texts.push(
      normalizeSearchText(feature.shortLabel),
      normalizeSearchText(feature.family),
      normalizeSearchText(feature.detail),
      ...(feature.aliases ?? []).map(normalizeSearchText),
      ...(feature.modulationTypes ?? []).map(normalizeSearchText),
      ...(feature.listPath ?? []).map(normalizeSearchText)
    )
  } else if (result.type === 'band') {
    const band = result.data as SpectrumBand
    texts.push(
      normalizeSearchText(band.subcategory),
      normalizeSearchText(band.description),
      ...band.applications.map(normalizeSearchText)
    )
  }

  if (texts.some(text => text === q)) return 0
  if (texts.some(text => text.startsWith(q))) return 8
  if (texts.some(text => text.includes(q))) return 18

  const tokens = q.split(' ').filter(Boolean)
  if (tokens.length > 1 && texts.some(text => tokens.every(token => text.includes(token)))) return 28

  return 44
}

function resultTypePriority(result: SearchResult, numericQuery: boolean, searchScope: SearchScope): number {
  if (numericQuery) {
    if (result.type === 'technology') return 0
    if (result.type === 'band') return 18
    if (result.type === 'educational') return 46
    return searchScope === 'rf' ? 80 : 38
  }

  if (result.type === 'technology') return 0
  if (result.type === 'band') return searchScope === 'rf' ? 10 : 18
  if (result.type === 'educational') return 24
  return 30
}

function densityTieBreak(result: SearchResult, density: SpectrumDetailDensity): number {
  if (density === 'max') return 0
  if (result.type === 'band') return density === 'clean' ? 8 : 4
  if (result.type === 'educational') return density === 'clean' ? 12 : 6
  const feature = result.data as FrequencyFeature
  if (feature.curatedRelations?.length) return -5
  if (feature.confidence === 'Scientifically Verified') return -3
  if (feature.confidence === 'Strong Evidence') return -2
  return 0
}

function sortResultsByPriority(
  results: SearchResult[],
  context: {
    query: string
    density: SpectrumDetailDensity
    favoriteIds: Set<string>
    relatedIds: Set<string>
    searchScope: SearchScope
  }
): SearchResult[] {
  const numericQuery = isNumericSearchQuery(context.query)

  return results
    .map((result, index) => {
      const id = resultId(result)
      const pinnedScore =
        (context.favoriteIds.has(id) ? -140 : 0) +
        (context.relatedIds.has(id) ? -110 : 0)

      const score = pinnedScore +
        resultTypePriority(result, numericQuery, context.searchScope) +
        resultTextPriority(result, context.query) +
        densityTieBreak(result, context.density)

      return { result, index, score }
    })
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.index - b.index
    })
    .map(item => item.result)
}

// Pure facet tally over a result set (before facet filtering) — so each facet
// chip can show how many matches it *would* have. Extracted from state so it can
// run inside the results useMemo.
function computeFacetCounts(source: SearchResult[]): {
  modulation: Record<ModulationFacet, number>
  signalClass: Record<SignalClassFacet, number>
} {
  const candidates = source
    .filter(item => item.type !== 'band' && item.type !== 'educational')
    .map(item => item.data as FrequencyFeature)
    .filter(item => (item.modulationTypes ?? []).length > 0)

  const modulation: Record<ModulationFacet, number> = { ...EMPTY_MODULATION_COUNTS, All: candidates.length }
  for (const facet of MODULATION_FACETS) {
    if (facet === 'All') continue
    const key = facet.toLowerCase()
    modulation[facet] = candidates.filter(feature =>
      (feature.modulationTypes ?? []).some(mod => mod.toLowerCase().includes(key))
    ).length
  }

  const signalClass: Record<SignalClassFacet, number> = { ...EMPTY_SIGNAL_COUNTS, All: candidates.length }
  signalClass.Digital = candidates.filter(feature => modulationSignalClass(feature.modulationTypes) === 'Digital').length
  signalClass.Analog = candidates.filter(feature => modulationSignalClass(feature.modulationTypes) === 'Analog').length
  signalClass.Hybrid = candidates.filter(feature => modulationSignalClass(feature.modulationTypes) === 'Hybrid').length

  return { modulation, signalClass }
}

export function SearchBar({ onBandSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [modulationFacet, setModulationFacet] = useState<ModulationFacet>('All')
  const [signalClassFacet, setSignalClassFacet] = useState<SignalClassFacet>('All')
  const [open, setOpen] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { allBands } = useSpectrumData({ centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 })
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setZoom = useSpectrumStore(s => s.setZoom)
  const setDetailDensity = useSpectrumStore(s => s.setDetailDensity)
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const selectedFeatureId = useSpectrumStore(s => s.selectedFeatureId)
  const setSelectedFeature = useSpectrumStore(s => s.setSelectedFeature)
  const favoriteFeatureIds = useSpectrumStore(s => s.favoriteFeatureIds)
  const searchScope = useSpectrumStore(s => s.searchScope)
  const setSearchScope = useSpectrumStore(s => s.setSearchScope)
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const toggleLayer = useSpectrumStore(s => s.toggleLayer)
  const toggleDetailLayer = useSpectrumStore(s => s.toggleDetailLayer)
  const openEducationalStory = useSpectrumStore(s => s.openEducationalStory)
  const selectedFeature = useMemo(
    () => (selectedFeatureId ? FEATURE_BY_ID.get(selectedFeatureId) : null),
    [selectedFeatureId]
  )
  const relatedBaseResults = useMemo(
    () => (selectedFeature ? buildRelatedSearchResults(selectedFeature) : []),
    [selectedFeature]
  )
  const relatedIds = useMemo(
    () => new Set(relatedBaseResults.map(item => item.data.id)),
    [relatedBaseResults]
  )
  const favoriteResults = useMemo(
    () => favoriteFeatureIds
      .map(id => FEATURE_BY_ID.get(id))
      .filter((feature): feature is FrequencyFeature => Boolean(feature))
      .map(feature => buildFeatureSearchResult(feature, 'Favorite')),
    [favoriteFeatureIds]
  )
  const favoriteIds = useMemo(
    () => new Set(favoriteResults.map(item => item.data.id)),
    [favoriteResults]
  )

  // Derived search results + facet counts. Pure derivation from query/facets, so
  // it belongs in render (useMemo), not in an effect that setState's them.
  const { results, modulationFacetCounts, signalClassFacetCounts } = useMemo(() => {
    if (allBands.length === 0 || !query.trim()) {
      return {
        results: [] as SearchResult[],
        modulationFacetCounts: EMPTY_MODULATION_COUNTS,
        signalClassFacetCounts: EMPTY_SIGNAL_COUNTS,
      }
    }
    const baseResults = search(query, allBands, { rfOnly: searchScope === 'rf' })
    let merged = baseResults
    if (selectedFeature && relatedBaseResults.length > 0) {
      const q = query.trim().toLowerCase()
      const relatedFiltered = relatedBaseResults.filter(item =>
        item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q)
      )
      if (relatedFiltered.length > 0) {
        const rids = new Set(relatedFiltered.map(item => item.data.id))
        merged = [...relatedFiltered, ...baseResults.filter(item => !rids.has(item.data.id))]
      }
    }
    const counts = computeFacetCounts(merged)
    const modulationFiltered = modulationFacet === 'All'
      ? merged
      : merged.filter(result => {
          if (result.type === 'band' || result.type === 'educational') return false
          const feature = result.data as FrequencyFeature
          return (feature.modulationTypes ?? []).some(mod => mod.toLowerCase().includes(modulationFacet.toLowerCase()))
        })
    const filtered = signalClassFacet === 'All'
      ? modulationFiltered
      : modulationFiltered.filter(result => {
          if (result.type === 'band' || result.type === 'educational') return false
          const feature = result.data as FrequencyFeature
          return modulationSignalClass(feature.modulationTypes) === signalClassFacet
        })
    return {
      results: sortResultsByPriority(filtered, { query, density: detailDensity, favoriteIds, relatedIds, searchScope }),
      modulationFacetCounts: counts.modulation,
      signalClassFacetCounts: counts.signalClass,
    }
  }, [query, allBands, detailDensity, selectedFeature, relatedBaseResults, favoriteIds, relatedIds, modulationFacet, signalClassFacet, searchScope])

  // Reset the keyboard highlight whenever a fresh result set is produced. The memo
  // returns a new array only when inputs change, so this fires exactly then.
  const [prevResults, setPrevResults] = useState(results)
  if (prevResults !== results) {
    setPrevResults(results)
    setActiveIdx(0)
  }

  const relatedResultIndices = useMemo(() => {
    const indices: number[] = []
    for (let i = 0; i < results.length; i += 1) {
      if (relatedIds.has(results[i].data.id)) indices.push(i)
    }
    return indices
  }, [results, relatedIds])
  const hasRelatedContext = Boolean(selectedFeature && relatedBaseResults.length > 0)
  const relatedMatchCount = relatedResultIndices.length


  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sq = params.get('sq')
    const sm = params.get('sm')
    const ss = params.get('ss')

    if (sq) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restores search state from the URL on mount (params are unavailable during SSR)
      setQuery(sq)
      setOpen(true)
    }

    if (sm && MODULATION_FACETS.some(item => item === sm)) {
      setModulationFacet(sm as ModulationFacet)
    }

    if (ss && SIGNAL_CLASS_FACETS.some(item => item === ss)) {
      setSignalClassFacet(ss as SignalClassFacet)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)

    if (query.trim()) {
      params.set('sq', query.trim())

      if (modulationFacet !== 'All') params.set('sm', modulationFacet)
      else params.delete('sm')

      if (signalClassFacet !== 'All') params.set('ss', signalClassFacet)
      else params.delete('ss')
    } else {
      params.delete('sq')
      params.delete('sm')
      params.delete('ss')
    }

    const queryString = params.toString()
    window.history.replaceState(null, '', queryString ? `?${queryString}` : window.location.pathname)
  }, [query, modulationFacet, signalClassFacet])

  // When the query is cleared, collapse advanced filters and reset facets.
  // Adjusted during render (guarded so it only fires when something actually
  // changes, which prevents a render loop) rather than in an effect.
  if (!query.trim() && (showAdvancedFilters || modulationFacet !== 'All' || signalClassFacet !== 'All')) {
    setShowAdvancedFilters(false)
    setModulationFacet('All')
    setSignalClassFacet('All')
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        setShowAdvancedFilters(false)
        setModulationFacet('All')
        setSignalClassFacet('All')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setZoom(result.targetFrequency, result.targetZoom)
      if (result.type === 'band') {
        const band = result.data as SpectrumBand
        if (band.is_sound_overlay && !showSound) toggleLayer('sound')
        if (!band.is_sound_overlay && !showEM) toggleLayer('EM')
        selectBand(band)
        onBandSelect?.(band)
      } else if (result.type === 'educational') {
        selectBand(null)
        // Open the story popup + animate to it (handled in SpectrumCanvas).
        openEducationalStory(result.data.id)
      } else {
        const feature = result.data as FrequencyFeature
        if (!showApplications) toggleLayer('applications')
        for (const layer of disabledDetailLayersForFeature(feature, detailLayers)) {
          toggleDetailLayer(layer)
        }
        setDetailDensity('details')
        setSelectedFeature(feature.id)
        selectBand(null)
      }
      setQuery('')
      setShowAdvancedFilters(false)
      setModulationFacet('All')
      setSignalClassFacet('All')
      setOpen(false)
    },
    [setZoom, selectBand, setDetailDensity, setSelectedFeature, showSound, showEM, showApplications, detailLayers, toggleLayer, toggleDetailLayer, onBandSelect, openEducationalStory]
  )

  const getResultGroup = (result: SearchResult) => {
    if (relatedIds.has(result.data.id)) return 'Related to current'
    if (favoriteIds.has(result.data.id)) return 'Favorites'

    if (result.type === 'band') return 'Bands'
    if (result.type === 'educational') return 'Educational Stories'
    const feature = result.data as FrequencyFeature
    if (feature.atlasCategory) return ATLAS_CATEGORY_LABELS[feature.atlasCategory]
    const layers = classifyFeature(feature)
    if (layers.includes('channels')) return 'Channels'
    if (layers.includes('natural')) return 'Natural/Physics'
    if (layers.includes('regulations')) return 'Regulations'
    if (layers.includes('hazards')) return 'Hazards'
    if (layers.includes('technologies')) return 'Technologies'
    return 'Points of Interest'
  }

  const getHiddenReason = (result: SearchResult): string | null => {
    if (result.type === 'band') {
      const band = result.data as SpectrumBand
      if (band.is_sound_overlay && !showSound) return 'Sound hidden'
      if (!band.is_sound_overlay && !showEM) return 'EM hidden'
      return null
    }

    if (result.type === 'educational') return null

    const feature = result.data as FrequencyFeature
    if (!showApplications) return 'Applications hidden'
    const disabled = disabledDetailLayersForFeature(feature, detailLayers)
    if (disabled.length === 0) return null
    return `${DETAIL_LAYER_LABELS[disabled[0] as SpectrumDetailLayerKey]} hidden`
  }

  const getModulationHint = (result: SearchResult): string | null => {
    if (result.type === 'band' || result.type === 'educational') return null
    const feature = result.data as FrequencyFeature
    if (!feature.modulationTypes || feature.modulationTypes.length === 0) return null
    return feature.modulationTypes.slice(0, 2).join(', ')
  }

  const handleResetFacets = () => {
    setModulationFacet('All')
    setSignalClassFacet('All')
    setShowAdvancedFilters(false)
  }

  const handleCopyFilteredLink = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }

  const hasSearchQuery = query.trim().length > 0
  const hasActiveFacets = modulationFacet !== 'All' || signalClassFacet !== 'All'
  const hasFilterableResults = modulationFacetCounts.All > 0
  const showSearchPanel = open && hasSearchQuery
  const showFilterToggle = hasFilterableResults || hasActiveFacets

  const groupedResults = results.reduce<Array<{ group: string; items: SearchResult[] }>>((groups, result) => {
    const group = getResultGroup(result)
    const existing = groups.find(item => item.group === group)
    if (existing) existing.items.push(result)
    else groups.push({ group, items: [result] })
    return groups
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && relatedResultIndices.length > 0) {
      e.preventDefault()
      const currentRelatedIdx = relatedResultIndices.findIndex(idx => idx === activeIdx)
      if (currentRelatedIdx === -1) {
        setActiveIdx(relatedResultIndices[0])
        return
      }

      const delta = e.shiftKey ? -1 : 1
      const next = (currentRelatedIdx + delta + relatedResultIndices.length) % relatedResultIndices.length
      setActiveIdx(relatedResultIndices[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      handleSelect(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setShowAdvancedFilters(false)
      setModulationFacet('All')
      setSignalClassFacet('All')
    }
  }

  return (
    <div className="search-container" role="search">
      <div className="search-input-wrap">
        <span className="search-icon" aria-hidden>⌕</span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          className="search-input"
          placeholder="Search tech, bands, frequencies... Ctrl K"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search electromagnetic spectrum"
          aria-autocomplete="list"
          aria-expanded={showSearchPanel && results.length > 0}
          aria-controls="search-results-panel"
          autoComplete="off"
        />
        {hasRelatedContext && (
          <span className="search-context-badge" aria-live="polite">
            Context: {selectedFeature?.shortLabel ?? selectedFeature?.label}
          </span>
        )}
      </div>

      {showSearchPanel && (
        <div className="search-panel" id="search-results-panel">
          <div className="search-facets search-scope-facets" role="toolbar" aria-label="Search scope">
            {SEARCH_SCOPE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`search-facet-btn ${searchScope === option.value ? 'active' : ''}`}
                onClick={() => setSearchScope(option.value)}
                aria-pressed={searchScope === option.value}
                title={option.title}
              >
                {option.label}
              </button>
            ))}
            {showFilterToggle && (
              <button
                type="button"
                className={`search-filter-toggle ${showAdvancedFilters || hasActiveFacets ? 'active' : ''}`}
                onClick={() => setShowAdvancedFilters(value => !value)}
                aria-expanded={showAdvancedFilters}
                aria-controls="search-advanced-filters"
              >
                Filters{hasActiveFacets ? ' on' : ''}
              </button>
            )}
          </div>

          {showAdvancedFilters && showFilterToggle && (
            <div id="search-advanced-filters" className="search-advanced-filters">
              <div className="search-facets" role="toolbar" aria-label="Signal class filters">
                {SIGNAL_CLASS_FACETS.map(facet => (
                  <button
                    key={facet}
                    type="button"
                    className={`search-facet-btn ${signalClassFacet === facet ? 'active' : ''}`}
                    onClick={() => setSignalClassFacet(facet)}
                    aria-pressed={signalClassFacet === facet}
                  >
                    {facet} ({signalClassFacetCounts[facet]})
                  </button>
                ))}
              </div>

          <div className="search-facets" role="toolbar" aria-label="Modulation filters">
            {MODULATION_FACETS.map(facet => (
              <button
                key={facet}
                type="button"
                className={`search-facet-btn ${modulationFacet === facet ? 'active' : ''}`}
                onClick={() => setModulationFacet(facet)}
                aria-pressed={modulationFacet === facet}
              >
                {facet} ({modulationFacetCounts[facet]})
              </button>
            ))}

            <button
              type="button"
              className="search-facet-reset"
              onClick={handleResetFacets}
            >
              Reset
            </button>

            <button
              type="button"
              className="search-facet-copy"
              onClick={handleCopyFilteredLink}
            >
              Copy link
            </button>
          </div>
            </div>
          )}

          {results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          {groupedResults.map(group => (
            <li key={group.group} className="search-group">
              <span className={`search-group-title ${group.group === 'Related to current' ? 'is-related' : ''} ${group.group === 'Favorites' ? 'is-favorite' : ''}`}>
                {group.group}
              </span>
              <ul>
                {group.items.map(result => {
                  const i = results.indexOf(result)
                  const hiddenReason = getHiddenReason(result)
                  const modulationHint = getModulationHint(result)
                  return (
                    <li
                      key={`${result.type}-${result.data.id}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      className={`search-result ${i === activeIdx ? 'active' : ''} ${hiddenReason ? 'hidden-result' : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onPointerDown={e => { e.preventDefault(); handleSelect(result) }}
                      onClick={() => handleSelect(result)}
                    >
                      <span className="result-label">{result.label}</span>
                      <span className="result-category">{hiddenReason ?? (modulationHint ? `${result.type} · ${modulationHint}` : result.type)}</span>
                      <span className="result-freq">{result.sublabel}</span>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
          {hasRelatedContext && relatedMatchCount > 0 && (
            <li className="search-hints" aria-hidden>
              <span>Tab/Shift+Tab: cycle related</span>
              <span>Enter: navigate</span>
            </li>
          )}
        </ul>
          )}
        </div>
      )}
    </div>
  )
}
