'use client'
// Phase 3.4 + Phase 18 — Canvas wrapper with loading state
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { SpectrumRenderer } from './SpectrumRenderer'
import { useZoom } from '@/hooks/useZoom'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { useViewport } from '@/hooks/useViewport'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { findNearestTechnology, findProfessionalBand } from '@/data/professionalSpectrum'
import { getVisibleSpectrumGradient } from '@/lib/pixi/colorMapper'
import { F_MIN, LOG_RANGE, freqToWavelength, freqToScreenX, screenXToFreq } from '@/lib/zoom/logMapper'
import { getBandLane, getFeatureLane } from '@/lib/spectrumLanes'
import { isFeatureAllowedByDetailLayers, isFeatureVisibleInMode } from '@/lib/spectrum/detailLayerClassifier'
import { SpectrumRuler } from '@/components/ui/SpectrumRuler'
import { FeaturePopup } from '@/components/ui/FeaturePopup'
import { SpectrumCategoryLegend } from '@/components/ui/SpectrumCategoryLegend'
import { CanvasContextBadge } from '@/components/ui/CanvasContextBadge'
import { EducationalPopup } from '@/components/ui/EducationalPopup'
import { EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'
import { SPECTRUM_LANE_BY_ID } from '@/lib/spectrumLanes'
import type { ZoomState, FrequencyFeature } from '@/types/spectrum'
import type { EducationalExample } from '@/data/educationalExamples'

export function SpectrumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SpectrumRenderer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null)
  const [popup, setPopup] = useState<{ feature: FrequencyFeature; x: number; y: number } | null>(null)
  const [eduPopup, setEduPopup] = useState<{ example: EducationalExample; x: number; y: number } | null>(null)

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
  const probe = useSpectrumStore(s => s.probe)
  const selectedBand = useSpectrumStore(s => s.selectedBand)
  const activeMode = useSpectrumStore(s => s.activeMode)
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const showHazards = useSpectrumStore(s => s.showHazards)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const pointerMovedRef = useRef(false)

  const visibleFeatures = useMemo(() => {
    if (detailDensity === 'clean' || !showApplications) return []
    const zoomBoost = detailDensity === 'max' ? 0.52 : 1
    return frequencyFeatures.filter(feature =>
      isFeatureVisibleInMode(feature, activeMode) &&
      isFeatureAllowedByDetailLayers(feature, detailLayers) &&
      zoomState.zoomLevel >= Math.max(1, feature.minZoom * zoomBoost) * 0.58
    )
  }, [activeMode, detailDensity, detailLayers, zoomState.zoomLevel, showApplications])

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
    rendererRef.current?.update(visibleBands, zoomState, visibleFeatures, activeMode, detailDensity, showEM, showApplications, showHazards, detailLayers)
  }, [visibleBands, visibleFeatures, zoomState, activeMode, detailDensity, showEM, showApplications, showHazards, detailLayers])

  // Highlight selected band — pass layer flags so highlight skips hidden bands
  useEffect(() => {
    rendererRef.current?.highlightBand(selectedBand, zoomState, showEM, showSound)
  }, [selectedBand, zoomState, showEM, showSound])

  useEffect(() => {
    if (!selectedBand) return
    if (selectedBand.is_sound_overlay && !showSound) selectBand(null)
    if (!selectedBand.is_sound_overlay && !showEM) selectBand(null)
  }, [selectedBand, selectBand, showEM, showSound])

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
      const probeLog = Math.log10(Math.max(frequency, F_MIN))
      const featureHit = detailDensity === 'clean' || !showApplications ? null : visibleFeatures
        .find(feature => {
          const halfBandwidth = feature.frequency_bandwidth / 2
          const min = Math.max(F_MIN, feature.frequency_center - halfBandwidth)
          const max = Math.max(min * 1.0001, feature.frequency_center + halfBandwidth)
          const featureWidthDecades = Math.max(Math.log10(max) - Math.log10(min), 0.002)
          return Math.abs(Math.log10(Math.max(feature.frequency_center, F_MIN)) - probeLog) < Math.max(featureWidthDecades / 2, logSpan * 0.006)
        })
      const professionalBand = activeMode === 'professional' ? findProfessionalBand(frequency) : null
      const professionalTech = activeMode === 'professional' && detailDensity !== 'clean' && showApplications && detailLayers.technologies
        ? findNearestTechnology(frequency)
        : null
      const hit = professionalTech ?? featureHit

      // Fall back to band-track hover when no POI is hit
      const clickYRatio = y / rect.height
      const laneTolerance = activeMode === 'professional' ? 0.042 : 0.07
      const bandHit = hit ? null : visibleBands.find(b => {
        if (frequency < b.frequency_min || frequency > b.frequency_max) return false
        if (!showEM && !b.is_sound_overlay) return false
        if (!showSound && b.is_sound_overlay) return false
        return Math.abs(clickYRatio - getBandLane(b).y) < laneTolerance
      })

      setProbe({
        frequency,
        wavelength: freqToWavelength(frequency),
        x,
        y,
        label: hit?.label ?? bandHit?.label,
        detail: hit?.detail ?? professionalBand?.uses ?? (bandHit?.applications.slice(0, 3).join(' · ') || undefined),
        family: hit
          ? ('family' in hit ? hit.family : 'Technology')
          : professionalBand?.rangeLabel ?? bandHit?.subcategory,
      })
    },
    [activeMode, detailDensity, detailLayers, showApplications, showEM, showSound, visibleBands, visibleFeatures, setProbe, zoomState]
  )

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      pointerDownRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      pointerMovedRef.current = false
      handlePointerDown(e)
    },
    [handlePointerDown]
  )

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const start = pointerDownRef.current
      if (start && Math.hypot(x - start.x, y - start.y) > 4) {
        pointerMovedRef.current = true
      }
      setReticle({ x, y })
      updateProbe(e.clientX, e.clientY, e.currentTarget)
      handlePointerMove(e)
    },
    [handlePointerMove, updateProbe]
  )

  const handleCanvasPointerLeave = useCallback(() => {
    setReticle(null)
    setProbe(null)
    pointerDownRef.current = null
    pointerMovedRef.current = false
    handlePointerUp()
  }, [handlePointerUp, setProbe])

  const handleEduNavigate = useCallback(
    (example: EducationalExample) => {
      const targetZoom = Math.max(zoomState.zoomLevel, 5)
      rendererRef.current?.animateTo(example.frequency, targetZoom, zoomState)
      const lane = SPECTRUM_LANE_BY_ID[example.category as keyof typeof SPECTRUM_LANE_BY_ID]
      const pinY = lane ? height * lane.y - 21 : height * 0.3
      setEduPopup({ example, x: width / 2, y: pinY })
    },
    [zoomState, width, height]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return
      if (pointerMovedRef.current) {
        pointerMovedRef.current = false
        pointerDownRef.current = null
        return
      }
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Educational pin hit test
      if (activeMode === 'educational' && detailDensity !== 'clean' && showApplications &&
          (detailLayers.pointsOfInterest || detailLayers.technologies)) {
        const eduHit = EDUCATIONAL_EXAMPLES.find(ex => {
          const lane = SPECTRUM_LANE_BY_ID[ex.category as keyof typeof SPECTRUM_LANE_BY_ID]
          if (!lane) return false
          const pinX = freqToScreenX(ex.frequency, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
          const pinY = rect.height * lane.y - 21
          return Math.abs(x - pinX) < 12 && Math.abs(y - pinY) < 14
        })
        if (eduHit) {
          setPopup(null)
          setEduPopup({ example: eduHit, x, y })
          pointerDownRef.current = null
          return
        }
      }

      const clickYRatio = y / rect.height
      const featureHit = visibleFeatures.find(feature => {
        const dotX = freqToScreenX(feature.frequency_center, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
        const dotY = rect.height * getFeatureLane(feature, visibleBands).y
        return Math.abs(x - dotX) < 14 && Math.abs(y - dotY) < 16
      })
      if (featureHit) {
        setPopup({ feature: featureHit, x, y })
        pointerDownRef.current = null
        return
      }

      // Band click — check frequency (x) AND lane y so clicks on the Sound
      // track don't accidentally select a Radio band at the same frequency
      setPopup(null)
      setEduPopup(null)
      const clickFreq = screenXToFreq(x, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
      const laneTolerance = activeMode === 'professional' ? 0.042 : 0.07
      const bandHit = visibleBands.find(b => {
        if (clickFreq < b.frequency_min || clickFreq > b.frequency_max) return false
        const laneY = getBandLane(b).y
        return Math.abs(clickYRatio - laneY) < laneTolerance
      })
      if (bandHit) selectBand(bandHit)
      pointerDownRef.current = null
    },
    [activeMode, detailDensity, detailLayers, showApplications, visibleBands, visibleFeatures, zoomState, selectBand]
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
        onPointerDown={handleCanvasPointerDown}
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
      {isReady && <CanvasContextBadge />}

      {isReady && probe?.label && (
        <div
          className="probe-tooltip"
          style={{ '--px': `${probe.x}px`, '--py': `${probe.y}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          <strong>{probe.label}</strong>
          <span>{probe.family}</span>
          {probe.detail && <em>{probe.detail}</em>}
        </div>
      )}

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

      {/* Educational example popup */}
      {eduPopup && (
        <EducationalPopup
          example={eduPopup.example}
          x={eduPopup.x}
          y={eduPopup.y}
          canvasW={width}
          canvasH={height}
          onClose={() => setEduPopup(null)}
          onNavigate={handleEduNavigate}
        />
      )}
    </div>
  )
}

