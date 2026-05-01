'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { search, type SearchResult } from '@/lib/search/searchIndex'
import type { SpectrumBand } from '@/types/spectrum'

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
        selectBand(band)
        onBandSelect?.(band)
      } else {
        setDetailDensity('details')
        selectBand(null)
      }
      setQuery('')
      setOpen(false)
    },
    [setZoom, selectBand, setDetailDensity, onBandSelect]
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
          {results.map((result, i) => (
            <li
              key={`${result.type}-${result.data.id}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`search-result ${i === activeIdx ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={e => { e.preventDefault(); handleSelect(result) }}
            >
              <span className="result-label">{result.label}</span>
              <span className="result-category">{result.type}</span>
              <span className="result-freq">{result.sublabel}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
