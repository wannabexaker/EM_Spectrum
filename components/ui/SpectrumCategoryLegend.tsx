'use client'

import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { encodeViewportState } from '@/lib/deeplink/urlState'
import { F_MIN, LOG_RANGE } from '@/lib/zoom/logMapper'
import { SPECTRUM_LANES, type SpectrumLane } from '@/lib/spectrumLanes'
import { useSpectrumStore } from '@/store/spectrumStore'

const MAX_NAV_ZOOM = 100
const MIN_NAV_ZOOM = 0.5

function getLaneTarget(lane: SpectrumLane): { center: number; zoom: number } {
  const minLog = Math.log10(Math.max(lane.frequencyMin, F_MIN))
  const maxLog = Math.log10(Math.max(lane.frequencyMax, F_MIN))
  const span = Math.max(maxLog - minLog, 0.08)
  const center = Math.pow(10, (minLog + maxLog) / 2)
  const zoom = Math.min(MAX_NAV_ZOOM, Math.max(MIN_NAV_ZOOM, LOG_RANGE / (span * 1.22)))
  return { center, zoom }
}

export function SpectrumCategoryLegend() {
  const setZoom = useSpectrumStore(s => s.setZoom)
  const selectBand = useSpectrumStore(s => s.selectBand)
  const animationRef = useRef<number | null>(null)

  const navigateToLane = useCallback((lane: SpectrumLane) => {
    const target = getLaneTarget(lane)
    selectBand(null)

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const start = useSpectrumStore.getState()
    const startLogCenter = Math.log10(Math.max(start.centerFrequency, F_MIN))
    const startLogZoom = Math.log10(Math.max(start.zoomLevel, MIN_NAV_ZOOM))
    const targetLogCenter = Math.log10(target.center)
    const targetLogZoom = Math.log10(target.zoom)
    const startTime = performance.now()
    const duration = 420

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const nextCenter = Math.pow(10, startLogCenter + (targetLogCenter - startLogCenter) * eased)
      const nextZoom = Math.pow(10, startLogZoom + (targetLogZoom - startLogZoom) * eased)
      setZoom(nextCenter, nextZoom)

      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick)
        return
      }

      animationRef.current = null
      encodeViewportState(target.center, target.zoom)
    }

    animationRef.current = requestAnimationFrame(tick)
  }, [selectBand, setZoom])

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
  }, [])

  return (
    <div className="category-legend" aria-label="Spectrum category navigation">
      {SPECTRUM_LANES.map(lane => (
        <button
          key={lane.id}
          className="category-lane-label"
          style={{ top: `${lane.y * 100}%`, '--lane-color': lane.color } as CSSProperties}
          type="button"
          onClick={() => navigateToLane(lane)}
          aria-label={`Zoom to ${lane.label}, ${lane.range}`}
        >
          <span className="category-lane-rail" />
          <span className="category-lane-copy">
            <strong>{lane.label}</strong>
            <em>{lane.range}</em>
          </span>
        </button>
      ))}
    </div>
  )
}
