'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { findNearestTechnology, findProfessionalBand } from '@/data/professionalSpectrum'
import { formatFrequency, formatWavelength, freqToWavelength, MIN_ZOOM, MAX_ZOOM } from '@/lib/zoom/logMapper'
import { getLODLevel } from '@/lib/zoom/lodController'
import { SPECTRUM_LANE_BY_ID } from '@/lib/spectrumLanes'
import type { FrequencyFeature } from '@/types/spectrum'
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
  const toggleFavoriteFeature = useSpectrumStore(s => s.toggleFavoriteFeature)
  const setSelectedFeature = useSpectrumStore(s => s.setSelectedFeature)
  const selectBand = useSpectrumStore(s => s.selectBand)
  const zoomAnimation = useRef<number | null>(null)

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
            {favoriteFeatures.length > 0 && (
              <span className="hud-saved-count">{favoriteFeatures.length}</span>
            )}
          </button>

          {savedOpen && (
            <div className="hud-saved-panel" role="dialog" aria-label="Saved frequencies">
              <div className="hud-saved-panel-head">
                <strong>Saved</strong>
                <span>{favoriteFeatures.length}</span>
              </div>

              {favoriteFeatures.length > 0 ? (
                <ul className="hud-saved-list">
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
