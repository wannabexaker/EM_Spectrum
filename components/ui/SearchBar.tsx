'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { searchBands } from '@/lib/search/searchIndex'
import { LOG_RANGE, formatFrequency } from '@/lib/zoom/logMapper'
import type { SpectrumBand, ZoomState } from '@/types/spectrum'

interface SearchBarProps {
  onBandSelect?: (band: SpectrumBand) => void
}

export function SearchBar({ onBandSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpectrumBand[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { allBands } = useSpectrumData({ centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 })
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setZoom = useSpectrumStore(s => s.setZoom)

  // Cmd/Ctrl+K to focus
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
    setResults(searchBands(query, allBands).slice(0, 8))
    setActiveIdx(0)
  }, [query, allBands])

  const handleSelect = useCallback(
    (band: SpectrumBand) => {
      const centerFreq = Math.sqrt(band.frequency_min * band.frequency_max)
      const logSpan = Math.log10(band.frequency_max) - Math.log10(band.frequency_min)
      const zoom = Math.max(0.1, Math.min(1000, LOG_RANGE / (logSpan * 2.5)))
      setZoom(centerFreq, zoom)
      selectBand(band)
      onBandSelect?.(band)
      setQuery('')
      setOpen(false)
    },
    [setZoom, selectBand, onBandSelect]
  )

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
          placeholder="Search bands, frequencies… ⌘K"
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
          {results.map((band, i) => (
            <li
              key={band.id}
              role="option"
              aria-selected={i === activeIdx}
              className={`search-result ${i === activeIdx ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={e => { e.preventDefault(); handleSelect(band) }}
            >
              <span className="result-label">{band.label}</span>
              <span className="result-category">{band.category}</span>
              <span className="result-freq">
                {formatFrequency(band.frequency_min)}–{formatFrequency(band.frequency_max)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
