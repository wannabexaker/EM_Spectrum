'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { search, type SearchResult } from '@/lib/search/searchIndex'
import { classifyFeature, disabledDetailLayersForFeature, DETAIL_LAYER_LABELS } from '@/lib/spectrum/detailLayerClassifier'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import type { FrequencyFeature, SpectrumBand, SpectrumDetailLayerKey } from '@/types/spectrum'

interface SearchBarProps {
  onBandSelect?: (band: SpectrumBand) => void
}

export function SearchBar({ onBandSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { allBands } = useSpectrumData({ centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 })
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setZoom = useSpectrumStore(s => s.setZoom)
  const setDetailDensity = useSpectrumStore(s => s.setDetailDensity)
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const toggleLayer = useSpectrumStore(s => s.toggleLayer)
  const toggleDetailLayer = useSpectrumStore(s => s.toggleDetailLayer)

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
    if (!query.trim() || allBands.length === 0) {
      setResults([])
      return
    }
    setResults(search(query, allBands))
    setActiveIdx(0)
  }, [query, allBands])

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

  const groupedResults = results.reduce<Array<{ group: string; items: SearchResult[] }>>((groups, result) => {
    const group = getResultGroup(result)
    const existing = groups.find(item => item.group === group)
    if (existing) existing.items.push(result)
    else groups.push({ group, items: [result] })
    return groups
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
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
      </div>

      {open && results.length > 0 && (
        <ul className="search-dropdown" role="listbox">
          {groupedResults.map(group => (
            <li key={group.group} className="search-group">
              <span className="search-group-title">{group.group}</span>
              <ul>
                {group.items.map(result => {
                  const i = results.indexOf(result)
                  const hiddenReason = getHiddenReason(result)
                  return (
                    <li
                      key={`${result.type}-${result.data.id}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      className={`search-result ${i === activeIdx ? 'active' : ''} ${hiddenReason ? 'hidden-result' : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseDown={e => { e.preventDefault(); handleSelect(result) }}
                    >
                      <span className="result-label">{result.label}</span>
                      <span className="result-category">{hiddenReason ?? result.type}</span>
                      <span className="result-freq">{result.sublabel}</span>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
