'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { formatFrequency, formatWavelength, freqToWavelength } from '@/lib/zoom/logMapper'
import { getLODLevel } from '@/lib/zoom/lodController'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 100
const ZOOM_PRESETS = [1, 2, 3, 5, 10]

function formatZoom(z: number): string {
  if (z >= 10) return z.toFixed(1)
  return z.toFixed(2).replace(/\.?0+$/, '')
}

export function FrequencyHUD() {
  const centerFrequency = useSpectrumStore(s => s.centerFrequency)
  const zoomLevel = useSpectrumStore(s => s.zoomLevel)
  const displayUnit = useSpectrumStore(s => s.displayUnit)
  const setDisplayUnit = useSpectrumStore(s => s.setDisplayUnit)
  const setZoom = useSpectrumStore(s => s.setZoom)
  const probe = useSpectrumStore(s => s.probe)
  const zoomAnimation = useRef<number | null>(null)

  // Zoom input state
  const [editingZoom, setEditingZoom] = useState(false)
  const [zoomInput, setZoomInput] = useState('')
  const zoomInputRef = useRef<HTMLInputElement>(null)

  const readoutFrequency = probe?.frequency ?? centerFrequency
  const wavelength = probe?.wavelength ?? freqToWavelength(centerFrequency)
  const lod = getLODLevel(zoomLevel)

  const primary = displayUnit === 'frequency'
    ? formatFrequency(readoutFrequency)
    : formatWavelength(wavelength)

  const secondary = displayUnit === 'frequency'
    ? formatWavelength(wavelength)
    : formatFrequency(readoutFrequency)

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

  // Focus + select all when input appears
  useEffect(() => {
    if (editingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus()
      zoomInputRef.current.select()
    }
  }, [editingZoom])

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
          className="hud-unit-toggle"
          onClick={() => setDisplayUnit(displayUnit === 'frequency' ? 'wavelength' : 'frequency')}
          title="Toggle Hz / wavelength"
          aria-label="Toggle display unit"
        >
          {displayUnit === 'frequency' ? 'Hz to lambda' : 'lambda to Hz'}
        </button>
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
