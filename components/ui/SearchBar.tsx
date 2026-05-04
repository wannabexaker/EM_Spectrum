'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { search, type SearchResult } from '@/lib/search/searchIndex'
import { classifyFeature, disabledDetailLayersForFeature, DETAIL_LAYER_LABELS } from '@/lib/spectrum/detailLayerClassifier'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { findRelatedFeatures } from '@/lib/spectrum/featureRelationships'
import type { FrequencyFeature, SpectrumBand, SpectrumDetailDensity, SpectrumDetailLayerKey } from '@/types/spectrum'

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

function getDensityPriority(result: SearchResult, density: SpectrumDetailDensity): number {
  if (density === 'max') return 0

  if (result.type === 'band') {
    return density === 'clean' ? 140 : 35
  }

  if (result.type === 'educational') {
    return density === 'clean' ? 70 : 18
  }

  const feature = result.data as FrequencyFeature
  let score = density === 'clean' ? 40 : 8

  if (feature.curatedRelations?.length) score += density === 'clean' ? 50 : 24
  if (feature.minZoom <= 4) score += density === 'clean' ? 16 : 8

  if (feature.confidence === 'Scientifically Verified') score += density === 'clean' ? 30 : 10
  else if (feature.confidence === 'Strong Evidence') score += density === 'clean' ? 20 : 7

  return score
}

function sortResultsByDensity(results: SearchResult[], density: SpectrumDetailDensity): SearchResult[] {
  if (density === 'max') return results

  return results
    .map((result, index) => ({ result, index, score: getDensityPriority(result, density) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.index - b.index
    })
    .map(item => item.result)
}

export function SearchBar({ onBandSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [modulationFacet, setModulationFacet] = useState<ModulationFacet>('All')
  const [signalClassFacet, setSignalClassFacet] = useState<SignalClassFacet>('All')
  const [modulationFacetCounts, setModulationFacetCounts] = useState<Record<ModulationFacet, number>>(EMPTY_MODULATION_COUNTS)
  const [signalClassFacetCounts, setSignalClassFacetCounts] = useState<Record<SignalClassFacet, number>>(EMPTY_SIGNAL_COUNTS)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { allBands } = useSpectrumData({ centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 })
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setZoom = useSpectrumStore(s => s.setZoom)
  const setDetailDensity = useSpectrumStore(s => s.setDetailDensity)
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const selectedFeatureId = useSpectrumStore(s => s.selectedFeatureId)
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const toggleLayer = useSpectrumStore(s => s.toggleLayer)
  const toggleDetailLayer = useSpectrumStore(s => s.toggleDetailLayer)
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
  const relatedResultIndices = useMemo(() => {
    const indices: number[] = []
    for (let i = 0; i < results.length; i += 1) {
      if (relatedIds.has(results[i].data.id)) indices.push(i)
    }
    return indices
  }, [results, relatedIds])
  const hasRelatedContext = Boolean(selectedFeature && relatedBaseResults.length > 0)
  const relatedMatchCount = relatedResultIndices.length

  const updateFacetCounts = useCallback((source: SearchResult[]) => {
    const candidates = source
      .filter(item => item.type !== 'band' && item.type !== 'educational')
      .map(item => item.data as FrequencyFeature)
      .filter(item => (item.modulationTypes ?? []).length > 0)

    const modulationCounts: Record<ModulationFacet, number> = { ...EMPTY_MODULATION_COUNTS, All: candidates.length }
    for (const facet of MODULATION_FACETS) {
      if (facet === 'All') continue
      const key = facet.toLowerCase()
      modulationCounts[facet] = candidates.filter(feature =>
        (feature.modulationTypes ?? []).some(mod => mod.toLowerCase().includes(key))
      ).length
    }

    const signalCounts: Record<SignalClassFacet, number> = { ...EMPTY_SIGNAL_COUNTS, All: candidates.length }
    signalCounts.Digital = candidates.filter(feature => modulationSignalClass(feature.modulationTypes) === 'Digital').length
    signalCounts.Analog = candidates.filter(feature => modulationSignalClass(feature.modulationTypes) === 'Analog').length
    signalCounts.Hybrid = candidates.filter(feature => modulationSignalClass(feature.modulationTypes) === 'Hybrid').length

    setModulationFacetCounts(modulationCounts)
    setSignalClassFacetCounts(signalCounts)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sq = params.get('sq')
    const sm = params.get('sm')
    const ss = params.get('ss')

    if (sq) {
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

    if (query.trim()) params.set('sq', query.trim())
    else params.delete('sq')

    if (modulationFacet !== 'All') params.set('sm', modulationFacet)
    else params.delete('sm')

    if (signalClassFacet !== 'All') params.set('ss', signalClassFacet)
    else params.delete('ss')

    window.history.replaceState(null, '', `?${params.toString()}`)
  }, [query, modulationFacet, signalClassFacet])

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
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (allBands.length === 0) {
      updateFacetCounts([])
      setResults([])
      setActiveIdx(0)
      return
    }

    if (!query.trim()) {
      const source = selectedFeature ? relatedBaseResults : []
      updateFacetCounts(source)
      if (selectedFeature) {
        setResults(relatedBaseResults)
      } else {
        setResults([])
      }
      setActiveIdx(0)
      return
    }

    const baseResults = search(query, allBands)

    let merged = baseResults
    if (selectedFeature && relatedBaseResults.length > 0) {
      const q = query.trim().toLowerCase()
      const relatedFiltered = relatedBaseResults.filter(item =>
        item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q)
      )

      if (relatedFiltered.length > 0) {
        const relatedIds = new Set(relatedFiltered.map(item => item.data.id))
        merged = [...relatedFiltered, ...baseResults.filter(item => !relatedIds.has(item.data.id))]
      }
    }

    updateFacetCounts(merged)

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

    setResults(sortResultsByDensity(filtered, detailDensity))
    setActiveIdx(0)
  }, [query, allBands, detailDensity, selectedFeature, relatedBaseResults, modulationFacet, signalClassFacet, updateFacetCounts])

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
      } else {
        const feature = result.data as FrequencyFeature
        if (!showApplications) toggleLayer('applications')
        for (const layer of disabledDetailLayersForFeature(feature, detailLayers)) {
          toggleDetailLayer(layer)
        }
        setDetailDensity('details')
        selectBand(null)
      }
      setQuery('')
      setOpen(false)
    },
    [setZoom, selectBand, setDetailDensity, showSound, showEM, showApplications, detailLayers, toggleLayer, toggleDetailLayer, onBandSelect]
  )

  const getResultGroup = (result: SearchResult) => {
    if (relatedIds.has(result.data.id)) return 'Related to current'

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
  }

  const handleCopyFilteredLink = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }

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
    }
  }

  return (
    <div className="search-container" role="search">
      <div className="search-input-wrap">
        <span className="search-icon" aria-hidden>⌕</span>
        <input
          ref={inputRef}
          type="search"
          className="search-input"
          placeholder="Search tech, bands, frequencies... Ctrl K"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search electromagnetic spectrum"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          autoComplete="off"
        />
        {hasRelatedContext && (
          <span className="search-context-badge" aria-live="polite">
            Context: {selectedFeature?.shortLabel ?? selectedFeature?.label}
          </span>
        )}
      </div>

      {open && (
        <>
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
        </>
      )}

      {open && results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          {groupedResults.map(group => (
            <li key={group.group} className="search-group">
              <span className={`search-group-title ${group.group === 'Related to current' ? 'is-related' : ''}`}>
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
  )
}
