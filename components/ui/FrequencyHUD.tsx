'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { findNearestTechnology, findProfessionalBand } from '@/data/professionalSpectrum'
import { formatFrequency, formatWavelength, freqToWavelength, MIN_ZOOM, MAX_ZOOM } from '@/lib/zoom/logMapper'
import { getLODLevel } from '@/lib/zoom/lodController'
import { SPECTRUM_LANE_BY_ID } from '@/lib/spectrumLanes'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { EDUCATIONAL_EXAMPLE_MAP, type EducationalExample } from '@/data/educationalExamples'
import type { FrequencyFeature, SpectrumBand } from '@/types/spectrum'
const ZOOM_PRESETS = [1, 2, 3, 5, 10]
const FEATURE_BY_ID = new Map(frequencyFeatures.map(feature => [feature.id, feature]))

function formatZoom(z: number): string {
  if (z >= 10) return z.toFixed(1)
  return z.toFixed(2).replace(/\.?0+$/, '')
}

export function FrequencyHUD() {
  const centerFrequency = useSpectrumStore(s => s.centerFrequency)
  const zoomLevel = useSpectrumStore(s => s.zoomLevel)
  const displayUnit = useSpectrumStore(s => s.displayUnit)
  const setZoom = useSpectrumStore(s => s.setZoom)
  const probe = useSpectrumStore(s => s.probe)
  const activeMode = useSpectrumStore(s => s.activeMode)
  const showCursorFrequency = useSpectrumStore(s => s.showCursorFrequency)
  const toggleCursorFrequency = useSpectrumStore(s => s.toggleCursorFrequency)
  const favoriteFeatureIds = useSpectrumStore(s => s.favoriteFeatureIds)
  const favoriteBandIds = useSpectrumStore(s => s.favoriteBandIds)
  const favoriteStoryIds = useSpectrumStore(s => s.favoriteStoryIds)
  const toggleFavoriteStory = useSpectrumStore(s => s.toggleFavoriteStory)
  const openEducationalStory = useSpectrumStore(s => s.openEducationalStory)
  const toggleFavoriteFeature = useSpectrumStore(s => s.toggleFavoriteFeature)
  const toggleFavoriteBand = useSpectrumStore(s => s.toggleFavoriteBand)
  const setSelectedFeature = useSpectrumStore(s => s.setSelectedFeature)
  const selectBand = useSpectrumStore(s => s.selectBand)
  const zoomAnimation = useRef<number | null>(null)

  const { allBands } = useSpectrumData({ centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 })

  // Zoom input state
  const [editingZoom, setEditingZoom] = useState(false)
  const [zoomInput, setZoomInput] = useState('')
  const [savedOpen, setSavedOpen] = useState(false)
  const zoomInputRef = useRef<HTMLInputElement>(null)
  const savedPanelRef = useRef<HTMLDivElement>(null)

  const readoutFrequency = probe?.frequency ?? centerFrequency
  const wavelength = probe?.wavelength ?? freqToWavelength(centerFrequency)
  const lod = getLODLevel(zoomLevel)

  const primary = displayUnit === 'frequency'
    ? formatFrequency(readoutFrequency)
    : formatWavelength(wavelength)

  const secondary = displayUnit === 'frequency'
    ? formatWavelength(wavelength)
    : formatFrequency(readoutFrequency)
  const professionalBand = activeMode === 'professional' ? findProfessionalBand(readoutFrequency) : null
  const professionalLane = professionalBand ? SPECTRUM_LANE_BY_ID[professionalBand.category] : null
  const nearbyTechnology = activeMode === 'professional' ? findNearestTechnology(readoutFrequency) : null
  const favoriteFeatures = useMemo(
    () => favoriteFeatureIds
      .map(id => FEATURE_BY_ID.get(id))
      .filter((feature): feature is FrequencyFeature => Boolean(feature)),
    [favoriteFeatureIds]
  )

  const favoriteBands = useMemo(
    () => favoriteBandIds
      .map(id => allBands.find(b => b.id === id))
      .filter((band): band is SpectrumBand => Boolean(band)),
    [favoriteBandIds, allBands]
  )

  const favoriteStories = useMemo(
    () => favoriteStoryIds
      .map(id => EDUCATIONAL_EXAMPLE_MAP.get(id))
      .filter((example): example is EducationalExample => Boolean(example)),
    [favoriteStoryIds]
  )

  const totalSaved = favoriteFeatures.length + favoriteBands.length + favoriteStories.length

  const animateToZoom = useCallback((targetZoom: number) => {
    if (zoomAnimation.current !== null) cancelAnimationFrame(zoomAnimation.current)
    const tick = () => {
      const state = useSpectrumStore.getState()
      const currentLogZoom = Math.log10(Math.max(state.zoomLevel, MIN_ZOOM))
      const targetLogZoom = Math.log10(targetZoom)
      const nextLogZoom = currentLogZoom + (targetLogZoom - currentLogZoom) * 0.36
      if (Math.abs(targetLogZoom - nextLogZoom) < 0.001) {
        setZoom(state.centerFrequency, targetZoom)
        zoomAnimation.current = null
        return
      }
      setZoom(state.centerFrequency, Math.pow(10, nextLogZoom))
      zoomAnimation.current = requestAnimationFrame(tick)
    }
    zoomAnimation.current = requestAnimationFrame(tick)
  }, [setZoom])

  const startEditingZoom = useCallback(() => {
    setZoomInput(formatZoom(zoomLevel))
    setEditingZoom(true)
  }, [zoomLevel])

  const navigateToFavorite = useCallback((feature: FrequencyFeature) => {
    const targetZoom = Math.max(8, Math.min(MAX_ZOOM, feature.minZoom * 1.25))
    setZoom(feature.frequency_center, targetZoom)
    setSelectedFeature(feature.id)
    selectBand(null)
    setSavedOpen(false)
  }, [selectBand, setSelectedFeature, setZoom])

  const navigateToFavoriteBand = useCallback((band: SpectrumBand) => {
    const center = Math.sqrt(band.frequency_min * band.frequency_max)
    const spanDecades = Math.max(
      0.08,
      Math.log10(Math.max(band.frequency_max, 1e-14)) - Math.log10(Math.max(band.frequency_min, 1e-14))
    )
    const targetZoom = Math.max(6, Math.min(MAX_ZOOM, 8 / spanDecades))
    setZoom(center, targetZoom)
    setSelectedFeature(null)
    selectBand(band)
    setSavedOpen(false)
  }, [selectBand, setSelectedFeature, setZoom])

  // Focus + select all when input appears
  useEffect(() => {
    if (editingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus()
      zoomInputRef.current.select()
    }
  }, [editingZoom])

  useEffect(() => {
    if (!savedOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (savedPanelRef.current?.contains(e.target as Node)) return
      setSavedOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSavedOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [savedOpen])

  const applyZoomInput = useCallback(() => {
    const raw = zoomInput.trim().replace(',', '.')
    const parsed = parseFloat(raw)
    if (!isNaN(parsed) && parsed > 0) {
      animateToZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parsed)))
    }
    setEditingZoom(false)
  }, [zoomInput, animateToZoom])

  const handleZoomKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); applyZoomInput() }
    if (e.key === 'Escape') { setEditingZoom(false) }
    // Arrow up/down nudge by 0.5
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const v = Math.min(MAX_ZOOM, (parseFloat(zoomInput.replace(',', '.')) || zoomLevel) + 0.5)
      setZoomInput(formatZoom(v))
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const v = Math.max(MIN_ZOOM, (parseFloat(zoomInput.replace(',', '.')) || zoomLevel) - 0.5)
      setZoomInput(formatZoom(v))
    }
  }, [zoomInput, zoomLevel, applyZoomInput])

  return (
    <div className="hud-bar">
      <div className="hud-readout">
        <span className="hud-label">{probe ? 'Probe' : 'Center'}</span>
        <span className="hud-value">{primary}</span>
        <span className="hud-secondary">= {secondary}</span>
      </div>

      <div className="hud-center">
        {probe?.label ? (
          <span className="hud-probe-detail">
            <strong>{probe.label}</strong>
            <em>{probe.detail}</em>
          </span>
        ) : (
          <span className="hud-probe-detail">
            <strong>Logarithmic spectrum probe</strong>
            <em>move pointer to inspect frequency, wavelength and sub-bands</em>
          </span>
        )}

        {/* Clickable zoom readout → editable input */}
        {editingZoom ? (
          <span className="hud-zoom-wrap">
            <input
              ref={zoomInputRef}
              className="zoom-text-input"
              value={zoomInput}
              onChange={e => setZoomInput(e.target.value)}
              onKeyDown={handleZoomKeyDown}
              onBlur={applyZoomInput}
              aria-label="Set zoom level"
            />
            <span className="zoom-text-suffix">×</span>
          </span>
        ) : (
          <span
            className="hud-zoom hud-zoom-editable"
            onClick={startEditingZoom}
            title="Click to set exact zoom"
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && startEditingZoom()}
          >
            x{formatZoom(zoomLevel)} zoom
          </span>
        )}

        <span className="hud-lod">LOD {lod}</span>

        {activeMode === 'professional' && (
          <span className="hud-pro-readout">
            <span>{professionalLane?.label ?? 'Out of band'}</span>
            <span>{professionalBand?.label ?? '-'}</span>
            <span>{nearbyTechnology?.label ?? 'no nearby tech'}</span>
          </span>
        )}
      </div>

      <div className="hud-actions">
        <div className="zoom-indicator" aria-label="Zoom presets">
          {ZOOM_PRESETS.map(level => (
            <button
              key={level}
              className={`zoom-pill ${Math.abs(Math.log10(zoomLevel) - Math.log10(level)) < 0.22 ? 'active' : ''}`}
              onClick={() => animateToZoom(level)}
              aria-label={`Set zoom to ${level}x`}
              title={`Set zoom to ${level}x`}
            >
              {level}
            </button>
          ))}
        </div>
        <button
          className={`hud-cursor-toggle ${showCursorFrequency ? 'active' : ''}`}
          onClick={toggleCursorFrequency}
          title="Show frequency next to cursor"
          aria-label="Toggle cursor frequency label"
          aria-pressed={showCursorFrequency}
        >
          cursor Hz
        </button>
        <div className="hud-saved-wrap" ref={savedPanelRef}>
          <button
            className={`hud-saved-toggle ${savedOpen ? 'active' : ''}`}
            onClick={() => setSavedOpen(open => !open)}
            title="Show saved frequencies"
            aria-label="Show saved frequencies"
            aria-expanded={savedOpen}
          >
            Saved
            {totalSaved > 0 && (
              <span className="hud-saved-count">{totalSaved}</span>
            )}
          </button>

          {savedOpen && (
            <div className="hud-saved-panel" role="dialog" aria-label="Saved frequencies">
              <div className="hud-saved-panel-head">
                <strong>Saved</strong>
                <span>{totalSaved}</span>
              </div>

              {totalSaved > 0 ? (
                <ul className="hud-saved-list">
                  {favoriteBands.map(band => (
                    <li key={`band-${band.id}`} className="hud-saved-item">
                      <button
                        className="hud-saved-link"
                        onClick={() => navigateToFavoriteBand(band)}
                        title={`Go to ${band.label}`}
                      >
                        <strong>{band.label}</strong>
                        <span>{formatFrequency(band.frequency_min)} – {formatFrequency(band.frequency_max)}</span>
                      </button>
                      <button
                        className="hud-saved-remove"
                        onClick={() => toggleFavoriteBand(band.id)}
                        aria-label={`Remove ${band.label} from saved`}
                        title="Remove saved band"
                      >
                        x
                      </button>
                    </li>
                  ))}
                  {favoriteStories.map(example => (
                    <li key={`story-${example.id}`} className="hud-saved-item">
                      <button
                        className="hud-saved-link"
                        onClick={() => openEducationalStory(example.id)}
                        title={`Open ${example.label}`}
                      >
                        <strong>{example.shortLabel}</strong>
                        <span>{formatFrequency(example.frequency)}</span>
                      </button>
                      <button
                        className="hud-saved-remove"
                        onClick={() => toggleFavoriteStory(example.id)}
                        aria-label={`Remove ${example.label} from saved`}
                        title="Remove saved story"
                      >
                        x
                      </button>
                    </li>
                  ))}
                  {favoriteFeatures.map(feature => (
                    <li key={feature.id} className="hud-saved-item">
                      <button
                        className="hud-saved-link"
                        onClick={() => navigateToFavorite(feature)}
                        title={`Go to ${feature.label}`}
                      >
                        <strong>{feature.shortLabel}</strong>
                        <span>{formatFrequency(feature.frequency_center)}</span>
                      </button>
                      <button
                        className="hud-saved-remove"
                        onClick={() => toggleFavoriteFeature(feature.id)}
                        aria-label={`Remove ${feature.label} from saved`}
                        title="Remove saved frequency"
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="hud-saved-empty">
                  Add a card with the star button.
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="hud-bookmark"
          onClick={() => {
            if (typeof window !== 'undefined') {
              navigator.clipboard.writeText(window.location.href).catch(() => {})
            }
          }}
          title="Copy deep link"
          aria-label="Copy deep link to current view"
        >
          #
        </button>
      </div>
    </div>
  )
}
