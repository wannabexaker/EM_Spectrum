'use client'
// Phase 3.4 + Phase 18 — Canvas wrapper with loading state
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { SpectrumRenderer } from './SpectrumRenderer'
import { useZoom } from '@/hooks/useZoom'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { useViewport } from '@/hooks/useViewport'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { getVisibleSpectrumGradient } from '@/lib/pixi/colorMapper'
import { LOG_RANGE, freqToWavelength, freqToScreenX, screenXToFreq } from '@/lib/zoom/logMapper'
import { getBandLane, getFeatureLane } from '@/lib/spectrumLanes'
import { SpectrumRuler } from '@/components/ui/SpectrumRuler'
import { FeaturePopup } from '@/components/ui/FeaturePopup'
import { SpectrumCategoryLegend } from '@/components/ui/SpectrumCategoryLegend'
import type { ZoomState, FrequencyFeature } from '@/types/spectrum'

export function SpectrumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SpectrumRenderer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null)
  const [popup, setPopup] = useState<{ feature: FrequencyFeature; x: number; y: number } | null>(null)

  const {
    zoomState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useZoom(canvasRef)

  const { visibleBands } = useSpectrumData(zoomState)
  const { width, height } = useViewport(canvasRef)
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setProbe = useSpectrumStore(s => s.setProbe)
  const selectedBand = useSpectrumStore(s => s.selectedBand)

  // POI features visible at current zoom level
  const visibleFeatures = useMemo(
    () => frequencyFeatures.filter(f => f.minZoom <= zoomState.zoomLevel),
    [zoomState.zoomLevel]
  )

  // Init renderer once canvas is mounted
  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new SpectrumRenderer(canvasRef.current)
    rendererRef.current = renderer

    // Animation callback — keeps store in sync during animated navigation
    renderer.onAnimationFrame = (state: ZoomState) => {
      useSpectrumStore.getState().setZoom(state.centerFrequency, state.zoomLevel)
    }

    renderer.init([]).then(() => {
      // Guard against unmount-before-init race condition
      if (rendererRef.current === renderer) setIsReady(true)
    })

    return () => {
      renderer.destroy()
      rendererRef.current = null
    }
  }, [])

  // Push band + state to renderer on every change
  useEffect(() => {
    rendererRef.current?.update(visibleBands, zoomState, frequencyFeatures)
  }, [visibleBands, zoomState])

  // Highlight selected band
  useEffect(() => {
    rendererRef.current?.highlightBand(selectedBand, zoomState)
  }, [selectedBand, zoomState])

  // Resize — throttled by useViewport's ResizeObserver (100ms)
  useEffect(() => {
    if (width > 0 && height > 0) {
      rendererRef.current?.resize(width, height)
    }
  }, [width, height])

  // Click to select band
  const updateProbe = useCallback(
    (clientX: number, clientY: number, target: HTMLCanvasElement) => {
      const rect = target.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const frequency = screenXToFreq(x, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
      const logSpan = LOG_RANGE / zoomState.zoomLevel
      const probeLog = Math.log10(Math.max(frequency, 1))
      const hit = frequencyFeatures
        .filter(feature => zoomState.zoomLevel >= feature.minZoom)
        .find(feature => {
          const halfBandwidth = feature.frequency_bandwidth / 2
          const min = Math.max(1, feature.frequency_center - halfBandwidth)
          const max = feature.frequency_center + halfBandwidth
          const featureWidthDecades = Math.max(Math.log10(max) - Math.log10(min), 0.002)
          return Math.abs(Math.log10(feature.frequency_center) - probeLog) < Math.max(featureWidthDecades / 2, logSpan * 0.006)
        })

      setProbe({
        frequency,
        wavelength: freqToWavelength(frequency),
        x,
        y,
        label: hit?.label,
        detail: hit?.detail,
        family: hit?.family,
      })
    },
    [setProbe, zoomState]
  )

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setReticle({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      updateProbe(e.clientX, e.clientY, e.currentTarget)
      handlePointerMove(e)
    },
    [handlePointerMove, updateProbe]
  )

  const handleCanvasPointerLeave = useCallback(() => {
    setReticle(null)
    setProbe(null)
    handlePointerUp()
  }, [handlePointerUp, setProbe])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // POI dot hit-test — must be near both the dot's x AND its lane y
      const clickYRatio = y / rect.height
      const hit = visibleFeatures.find(f => {
        const dotX = freqToScreenX(f.frequency_center, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
        const dotY = rect.height * getFeatureLane(f, visibleBands).y
        return Math.abs(x - dotX) < 14 && Math.abs(y - dotY) < 16
      })
      if (hit) {
        setPopup({ feature: hit, x, y })
        return
      }

      // Band click — check frequency (x) AND lane y so clicks on the Sound
      // track don't accidentally select a Radio band at the same frequency
      setPopup(null)
      const clickFreq = screenXToFreq(x, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
      const bandHit = visibleBands.find(b => {
        if (clickFreq < b.frequency_min || clickFreq > b.frequency_max) return false
        const laneY = getBandLane(b).y
        return Math.abs(clickYRatio - laneY) < 0.07   // ±7% of canvas height
      })
      if (bandHit) selectBand(bandHit)
    },
    [visibleBands, visibleFeatures, zoomState, selectBand]
  )

  return (
    <div className="relative w-full h-full">
      {/* Phase 18 — Loading skeleton while PixiJS initializes */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#02030a]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-64 h-8 rounded-full overflow-hidden relative">
              <div
                className="absolute inset-0 animate-pulse"
                style={{ background: getVisibleSpectrumGradient(), opacity: 0.4 }}
              />
            </div>
            <p className="text-[#7f91b2] font-mono text-sm tracking-widest">
              INITIALIZING SPECTRUM PROBE...
            </p>
          </div>
        </div>
      )}

      {/* Canvas — cursor-none because we draw our own reticle */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-none cursor-none transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Electromagnetic spectrum visualization. Use arrow keys to pan, scroll to zoom."
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handleCanvasPointerLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onContextMenu={e => e.preventDefault()}
      />

      {/* Scope reticle — crosshair follows cursor */}
      {isReady && reticle && (
        <div
          className="scope-reticle"
          style={{ '--rx': `${reticle.x}px`, '--ry': `${reticle.y}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          <div className="reticle-h" />
          <div className="reticle-v" />
          <div className="reticle-ring" />
          <div className="reticle-dot" />
        </div>
      )}

      {/* Frequency + track rulers */}
      {isReady && <SpectrumRuler />}
      {isReady && <SpectrumCategoryLegend />}

      {/* POI feature popup */}
      {popup && (
        <FeaturePopup
          feature={popup.feature}
          x={popup.x}
          y={popup.y}
          canvasW={width}
          canvasH={height}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
