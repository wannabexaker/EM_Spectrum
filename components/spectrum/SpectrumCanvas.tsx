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
import { F_MIN, LOG_RANGE, formatFrequency, formatWavelength, freqToWavelength, freqToScreenX, screenXToFreq } from '@/lib/zoom/logMapper'
import { getBandLane, getFeatureLane, SPECTRUM_LANES, SPECTRUM_LANE_BY_ID } from '@/lib/spectrumLanes'
import { isFeatureAllowedByDetailLayers, isFeatureVisibleInMode } from '@/lib/spectrum/detailLayerClassifier'
import { getFeatureZoomBoostForDensity, isFeatureInDensityScope } from '@/lib/spectrum/detailDensityProfiles'
import { SpectrumRuler } from '@/components/ui/SpectrumRuler'
import { FeaturePopup } from '@/components/ui/FeaturePopup'
import { SpectrumCategoryLegend } from '@/components/ui/SpectrumCategoryLegend'
import { CanvasContextBadge } from '@/components/ui/CanvasContextBadge'
import { EducationalPopup } from '@/components/ui/EducationalPopup'
import { EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'
import type { ZoomState, FrequencyFeature, SpectrumBand } from '@/types/spectrum'
import type { EducationalExample } from '@/data/educationalExamples'

function SpectrumCanvasFallback({
  bands,
  zoomState,
  selectedBand,
}: {
  bands: SpectrumBand[]
  zoomState: ZoomState
  selectedBand: SpectrumBand | null
}) {
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = fallbackCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(320, Math.floor(rect.width))
    const h = Math.max(220, Math.floor(rect.height))
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#04060f'
    ctx.fillRect(0, 0, w, h)

    const trackH = Math.max(12, h * 0.065)
    for (const band of bands) {
      const x1 = freqToScreenX(band.frequency_min, w, zoomState.centerFrequency, zoomState.zoomLevel)
      const x2 = freqToScreenX(band.frequency_max, w, zoomState.centerFrequency, zoomState.zoomLevel)
      const left = Math.max(0, Math.min(x1, x2))
      const right = Math.min(w, Math.max(x1, x2))
      const bw = right - left
      if (bw <= 0.8) continue

      const lane = getBandLane(band)
      const y = h * lane.y
      const isSelected = selectedBand?.id === band.id

      ctx.globalAlpha = isSelected ? 0.82 : 0.42
      ctx.fillStyle = lane.color
      ctx.fillRect(left, y - trackH / 2, bw, trackH)
      ctx.globalAlpha = 1

      if (isSelected) {
        ctx.strokeStyle = '#dff7ff'
        ctx.lineWidth = 1.3
        ctx.strokeRect(left, y - trackH / 2, bw, trackH)
      }

      // Band label — only if wide enough
      if (bw > 36) {
        ctx.globalAlpha = isSelected ? 0.95 : 0.7
        ctx.fillStyle = '#f0f0ff'
        ctx.font = `${Math.min(11, Math.max(8, bw * 0.12))}px "Space Grotesk", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = band.label.length > bw / 6 ? band.label.slice(0, Math.floor(bw / 6)) + '…' : band.label
        ctx.fillText(label, (left + right) / 2, y)
        ctx.globalAlpha = 1
      }
    }

    // center guide line
    ctx.strokeStyle = 'rgba(116, 214, 255, 0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(w * 0.5, 0)
    ctx.lineTo(w * 0.5, h)
    ctx.stroke()
  }, [bands, zoomState, selectedBand])

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <canvas
        ref={fallbackCanvasRef}
        className="h-full w-full"
      />
      <div className="absolute left-3 top-3 rounded-md border border-[#74d6ff44] bg-[#0b0d18cc] px-2 py-1 text-[11px] text-[#dff7ff]">
        Safe Mode (2D fallback)
      </div>
    </div>
  )
}

export function SpectrumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SpectrumRenderer | null>(null)
  const [preferFallback, setPreferFallback] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null)
  const [popup, setPopup] = useState<{ feature: FrequencyFeature; x: number; y: number } | null>(null)
  const [eduPopup, setEduPopup] = useState<{ example: EducationalExample; x: number; y: number } | null>(null)

  const {
    zoomState,
    commitZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    touchMoved,
  } = useZoom(canvasRef)

  const { visibleBands, allBands } = useSpectrumData(zoomState)
  const { width, height } = useViewport(canvasRef)
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setProbe = useSpectrumStore(s => s.setProbe)
  const setSelectedFeature = useSpectrumStore(s => s.setSelectedFeature)
  const setSelectedLane = useSpectrumStore(s => s.setSelectedLane)
  const selectedFeatureId = useSpectrumStore(s => s.selectedFeatureId)
  const focusedLaneId = useSpectrumStore(s => s.focusedLaneId)
  const selectedLaneId = useSpectrumStore(s => s.selectedLaneId)
  const probe = useSpectrumStore(s => s.probe)
  const selectedBand = useSpectrumStore(s => s.selectedBand)
  const activeMode = useSpectrumStore(s => s.activeMode)
  const detailDensity = useSpectrumStore(s => s.detailDensity)
  const showEM = useSpectrumStore(s => s.showEM)
  const showSound = useSpectrumStore(s => s.showSound)
  const showApplications = useSpectrumStore(s => s.showApplications)
  const showHazards = useSpectrumStore(s => s.showHazards)
  const detailLayers = useSpectrumStore(s => s.detailLayers)
  const displayUnit = useSpectrumStore(s => s.displayUnit)
  const showCursorFrequency = useSpectrumStore(s => s.showCursorFrequency)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const pointerMovedRef = useRef(false)

  const visibleFeatures = useMemo(() => {
    if (!showApplications) return []
    const zoomBoost = getFeatureZoomBoostForDensity(detailDensity, activeMode)
    return frequencyFeatures.filter(feature =>
      isFeatureVisibleInMode(feature, activeMode) &&
      isFeatureInDensityScope(feature, detailDensity) &&
      isFeatureAllowedByDetailLayers(feature, detailLayers) &&
      (() => {
        const lane = getFeatureLane(feature, allBands)
        if (lane.id === 'sound') return showSound
        return showEM
      })() &&
      zoomState.zoomLevel >= Math.max(1, feature.minZoom * zoomBoost) * 0.58
    )
  }, [activeMode, allBands, detailDensity, detailLayers, zoomState.zoomLevel, showApplications, showEM, showSound])

  // Detect coarse pointer after mount (avoids SSR/client hydration mismatch)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setPreferFallback(true)
    }
  }, [])

  // Init renderer once canvas is mounted
  useEffect(() => {
    if (!canvasRef.current) return

    // Reliability-first: mobile devices open directly in Safe Mode to avoid WebGL stalls.
    if (preferFallback) {
      setIsReady(false)
      setInitError('Mobile safe mode enabled')
      return
    }

    const renderer = new SpectrumRenderer(canvasRef.current)
    rendererRef.current = renderer
    setInitError(null)
    const initTimer = window.setTimeout(() => {
      if (rendererRef.current !== renderer) return
      setInitError('Renderer initialization timed out')
      setIsReady(false)
    }, 2500)

    // Animation callback — keeps store in sync during animated navigation
    renderer.onAnimationFrame = (state: ZoomState) => {
      useSpectrumStore.getState().setZoom(state.centerFrequency, state.zoomLevel)
    }

    renderer.init([])
      .then(() => {
        // Guard against unmount-before-init race condition
        if (rendererRef.current === renderer) {
          clearTimeout(initTimer)
          setIsReady(true)
          setInitError(null)
        }
      })
      .catch((error: unknown) => {
        if (rendererRef.current !== renderer) return
        clearTimeout(initTimer)
        const message = error instanceof Error ? error.message : 'Unknown renderer initialization error'
        setInitError(message)
        setIsReady(false)
      })

    return () => {
      clearTimeout(initTimer)
      renderer.destroy()
      rendererRef.current = null
    }
  }, [preferFallback])

  // Global watchdog: never stay forever in "INITIALIZING" state.
  useEffect(() => {
    if (isReady || initError) return
    const watchdog = window.setTimeout(() => {
      setInitError('Initialization watchdog fallback')
      setIsReady(false)
    }, 3500)
    return () => window.clearTimeout(watchdog)
  }, [isReady, initError])

  // Push band + state to renderer on every change
  useEffect(() => {
    rendererRef.current?.update(visibleBands, zoomState, visibleFeatures, activeMode, detailDensity, showEM, showApplications, showHazards, detailLayers)
  }, [visibleBands, visibleFeatures, zoomState, activeMode, detailDensity, showEM, showApplications, showHazards, detailLayers])

  // Highlight selected band — pass layer flags so highlight skips hidden bands
  useEffect(() => {
    rendererRef.current?.highlightBand(selectedBand, zoomState, showEM, showSound)
  }, [selectedBand, zoomState, showEM, showSound])

  useEffect(() => {
    rendererRef.current?.setSelectedFeature(selectedFeatureId)
  }, [selectedFeatureId])

  useEffect(() => {
    rendererRef.current?.setLaneFocus(focusedLaneId, selectedLaneId)
  }, [focusedLaneId, selectedLaneId])

  useEffect(() => {
    if (!selectedBand) return
    if (selectedBand.is_sound_overlay && !showSound) selectBand(null)
    if (!selectedBand.is_sound_overlay && !showEM) selectBand(null)
  }, [selectedBand, selectBand, showEM, showSound])

  // ─── Keyboard arrow navigation ────────────────────────────────────────
  // ArrowLeft / ArrowRight          → pan OR prev/next band (band selected) OR prev/next POI (feature selected)
  // ArrowUp / ArrowDown             → jump to adjacent spectrum lane at current frequency
  // Shift + ArrowLeft / ArrowRight  → prev/next POI feature (regardless of selection)
  // Shift + ArrowUp / ArrowDown     → nearest POI in the lane above/below
  useEffect(() => {
    // Lanes sorted top→bottom by vertical position on screen
    const lanesOrdered = [...SPECTRUM_LANES].sort((a, b) => a.y - b.y)

    function getCurrentLaneIdx(centerFreq: number): number {
      const store = useSpectrumStore.getState()
      if (store.selectedBand) {
        const lane = getBandLane(store.selectedBand)
        const i = lanesOrdered.findIndex(l => l.id === lane.id)
        if (i !== -1) return i
      }
      if (store.selectedFeatureId) {
        const feat = visibleFeatures.find(f => f.id === store.selectedFeatureId)
        if (feat) {
          const lane = getFeatureLane(feat, allBands)
          const i = lanesOrdered.findIndex(l => l.id === lane.id)
          if (i !== -1) return i
        }
      }
      // Fallback: which lane's frequency range contains the current center
      const i = lanesOrdered.findIndex(l => centerFreq >= l.frequencyMin && centerFreq <= l.frequencyMax)
      return i === -1 ? 0 : i
    }

    function selectFeature(feat: ReturnType<typeof visibleFeatures[0] extends infer T ? () => T : never> extends never ? (typeof visibleFeatures)[number] : (typeof visibleFeatures)[number]) {
      const store = useSpectrumStore.getState()
      const lane = getFeatureLane(feat, allBands)
      commitZoom(feat.frequency_center, store.zoomLevel)
      store.setSelectedFeature(feat.id)
      store.setSelectedLane(lane.id)
      store.selectBand(null)
      setPopup({ feature: feat, x: width / 2, y: height * lane.y })
      setEduPopup(null)
    }

    function getLaneFeatures(laneId: string) {
      return visibleFeatures
        .filter(f => getFeatureLane(f, allBands).id === laneId)
        .sort((a, b) => a.frequency_center - b.frequency_center)
    }

    function getNearestFeatureIndex(features: typeof visibleFeatures, frequency: number): number {
      if (features.length === 0) return -1
      const logTarget = Math.log10(Math.max(frequency, F_MIN))
      let bestIdx = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let i = 0; i < features.length; i += 1) {
        const dist = Math.abs(Math.log10(Math.max(features[i].frequency_center, F_MIN)) - logTarget)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }
      return bestIdx
    }

    const handleNavKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      if (!isArrow) return

      const store = useSpectrumStore.getState()
      const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1
      const isHoriz = e.key === 'ArrowLeft' || e.key === 'ArrowRight'

      // ── Shift + Arrow: POI navigation ──────────────────────────────────
      if (e.shiftKey) {
        if (isHoriz) {
          // Shift+Left/Right → prev/next visible POI by frequency
          if (visibleFeatures.length === 0) return
          const sorted = [...visibleFeatures].sort((a, b) => a.frequency_center - b.frequency_center)
          const curIdx = store.selectedFeatureId
            ? sorted.findIndex(f => f.id === store.selectedFeatureId)
            : dir === 1 ? -1 : sorted.length
          const nextIdx = (curIdx + dir + sorted.length) % sorted.length
          e.preventDefault()
          e.stopImmediatePropagation()
          selectFeature(sorted[nextIdx])
        } else {
          // Shift+Up/Down → nearest POI in the adjacent lane
          const laneIdx = getCurrentLaneIdx(store.centerFrequency)
          const adjIdx = laneIdx + dir
          if (adjIdx < 0 || adjIdx >= lanesOrdered.length) return
          const adjLane = lanesOrdered[adjIdx]
          const candidates = visibleFeatures.filter(f => {
            const fl = getFeatureLane(f, allBands)
            return fl.id === adjLane.id
          })
          if (candidates.length === 0) return
          const logCur = Math.log10(Math.max(store.centerFrequency, 1e-14))
          const nearest = candidates.reduce((best, f) =>
            Math.abs(Math.log10(Math.max(f.frequency_center, 1e-14)) - logCur) <
            Math.abs(Math.log10(Math.max(best.frequency_center, 1e-14)) - logCur)
              ? f : best
          )
          e.preventDefault()
          e.stopImmediatePropagation()
          selectFeature(nearest)
        }
        return
      }

      // ── No Shift ───────────────────────────────────────────────────────
      if (isHoriz) {
        // ArrowLeft/Right: stay in current lane (no cross-lane jumps)
        if (store.selectedBand) {
          const bandLaneId = getBandLane(store.selectedBand).id
          const sorted = visibleBands
            .filter(b => getBandLane(b).id === bandLaneId)
            .sort((a, b) => a.frequency_min - b.frequency_min)
          const idx = sorted.findIndex(b => b.id === store.selectedBand!.id)
          if (idx === -1 || sorted.length === 0) return
          const next = sorted[(idx + dir + sorted.length) % sorted.length]
          e.preventDefault()
          e.stopImmediatePropagation()
          const logCenter = (Math.log10(Math.max(next.frequency_min, 1e-14)) + Math.log10(Math.max(next.frequency_max, 1e-14))) / 2
          commitZoom(Math.pow(10, logCenter), store.zoomLevel)
          store.selectBand(next)
        } else {
          const laneIdx = getCurrentLaneIdx(store.centerFrequency)
          const laneId = lanesOrdered[laneIdx]?.id ?? lanesOrdered[0]?.id
          if (!laneId) return

          const sorted = getLaneFeatures(laneId)
          if (sorted.length === 0) return

          const idx = store.selectedFeatureId
            ? sorted.findIndex(f => f.id === store.selectedFeatureId)
            : getNearestFeatureIndex(sorted, store.centerFrequency)

          if (idx === -1) return
          const next = sorted[(idx + dir + sorted.length) % sorted.length]
          e.preventDefault()
          e.stopImmediatePropagation()
          selectFeature(next)
        }
      } else {
        // ArrowUp/Down: jump to adjacent lane at the same (clamped) frequency
        const laneIdx = getCurrentLaneIdx(store.centerFrequency)
        const adjIdx = laneIdx + dir
        if (adjIdx < 0 || adjIdx >= lanesOrdered.length) return
        const adjLane = lanesOrdered[adjIdx]

        const laneFeatures = getLaneFeatures(adjLane.id)
        if (laneFeatures.length > 0) {
          const nearestIdx = getNearestFeatureIndex(laneFeatures, store.centerFrequency)
          if (nearestIdx !== -1) {
            e.preventDefault()
            e.stopImmediatePropagation()
            selectFeature(laneFeatures[nearestIdx])
            return
          }
        }

        // Clamp current center frequency to the target lane's range
        const targetFreq = Math.min(
          Math.max(store.centerFrequency, adjLane.frequencyMin),
          adjLane.frequencyMax
        )
        e.preventDefault()
        e.stopImmediatePropagation()
        commitZoom(targetFreq, store.zoomLevel)
      }
    }

    window.addEventListener('keydown', handleNavKey, { capture: true })
    return () => window.removeEventListener('keydown', handleNavKey, { capture: true })
  }, [allBands, visibleBands, visibleFeatures, commitZoom, width, height])

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
      const featureHit = detailDensity === 'clean' || !showApplications
        ? null
        : visibleFeatures
          .map(feature => {
            const lane = getFeatureLane(feature, visibleBands)
            const dotX = freqToScreenX(feature.frequency_center, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
            const dotY = rect.height * lane.y - 16
            const dx = x - dotX
            const dy = y - dotY
            return { feature, d2: dx * dx + dy * dy, dx: Math.abs(dx), dy: Math.abs(dy) }
          })
          .filter(item => item.dx <= 14 && item.dy <= 16)
          .sort((a, b) => a.d2 - b.d2)[0]?.feature ?? null

      const professionalTechCandidate =
        activeMode === 'professional' && detailDensity !== 'clean' && showApplications && detailLayers.technologies
          ? findNearestTechnology(frequency)
          : null

      const professionalTech = professionalTechCandidate
        ? (() => {
            const lane = SPECTRUM_LANE_BY_ID[professionalTechCandidate.category]
            if (!lane) return null
            const tx = freqToScreenX(professionalTechCandidate.frequency, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
            const ty = rect.height * lane.y - 24
            const dx = Math.abs(x - tx)
            const dy = Math.abs(y - ty)
            return dx <= 14 && dy <= 16 ? professionalTechCandidate : null
          })()
        : null

      const hit = professionalTech ?? featureHit
      const hitModulation = featureHit?.modulationTypes?.slice(0, 3).join(', ')

      // Tell renderer which feature is hovered so it can enlarge dot + show aura
      rendererRef.current?.setHoveredFeature(featureHit?.id ?? null)

      setProbe({
        frequency,
        wavelength: freqToWavelength(frequency),
        x,
        y,
        label: hit?.label,
        detail: hit?.detail,
        family: hit ? ('family' in hit ? hit.family : 'Technology') : undefined,
        modulation: hitModulation,
      })
    },
    [activeMode, detailDensity, detailLayers, showApplications, visibleBands, visibleFeatures, setProbe, zoomState]
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
    rendererRef.current?.setHoveredFeature(null)
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

  const handleFeatureNavigate = useCallback(
    (feature: FrequencyFeature) => {
      const lane = getFeatureLane(feature, visibleBands)
      const targetZoom = Math.max(zoomState.zoomLevel, Math.max(5, feature.minZoom * 0.85))
      rendererRef.current?.animateTo(feature.frequency_center, targetZoom, zoomState)
      setSelectedFeature(feature.id)
      setSelectedLane(lane.id)
      selectBand(null)
      setEduPopup(null)
      setPopup({ feature, x: width / 2, y: height * lane.y - 16 })
    },
    [visibleBands, zoomState, width, height, setSelectedFeature, setSelectedLane, selectBand]
  )

  const selectAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return
      if (pointerMovedRef.current) {
        pointerMovedRef.current = false
        pointerDownRef.current = null
        return
      }
      const rect = canvasRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

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
          setSelectedFeature(null)
          setSelectedLane(eduHit.category)
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
        setSelectedFeature(featureHit.id)
        setSelectedLane(getFeatureLane(featureHit, visibleBands).id)
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
      if (bandHit) {
        selectBand(bandHit)
        setSelectedFeature(null)
        setSelectedLane(getBandLane(bandHit).id)
      } else {
        // Click on empty space → full deselect
        selectBand(null)
        setSelectedFeature(null)
        setSelectedLane(null)
      }
      pointerDownRef.current = null
    },
    [activeMode, detailDensity, detailLayers, showApplications, visibleBands, visibleFeatures, zoomState, selectBand, setSelectedFeature, setSelectedLane]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      selectAtPoint(e.clientX, e.clientY)
    },
    [selectAtPoint]
  )

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Mobile tap support: touch devices fire pointerup but not always click with touch-action: none.
      // Only treat as tap if the finger didn't pan (touchMoved tracks single-finger drag in useZoom).
      if (e.pointerType === 'touch' && !touchMoved.current) {
        selectAtPoint(e.clientX, e.clientY)
      }
      handlePointerUp()
    },
    [handlePointerUp, selectAtPoint, touchMoved]
  )

  return (
    <div className="relative w-full h-full">
      {/* Phase 18 — Loading skeleton while PixiJS initializes */}
      {!isReady && !initError && !preferFallback && (
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

      {(initError || preferFallback) && (
        <>
          <SpectrumCanvasFallback
            bands={visibleBands}
            zoomState={zoomState}
            selectedBand={selectedBand}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 rounded-lg border border-[#74d6ff20] bg-[#0b0d18d0] p-2 text-xs text-[#aebcda]">
            Lightweight mode · Drag to pan · Pinch to zoom · Tap to select
          </div>
        </>
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
        onPointerUp={handleCanvasPointerUp}
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

      {isReady && reticle && probe && showCursorFrequency && (
        <div
          className="cursor-frequency-tag"
          style={{ '--px': `${reticle.x}px`, '--py': `${reticle.y}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          {displayUnit === 'frequency'
            ? formatFrequency(probe.frequency)
            : formatWavelength(probe.wavelength)}
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
          {probe.modulation && <span>mod {probe.modulation}</span>}
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
          onNavigate={handleFeatureNavigate}
          onClose={() => { setPopup(null); setSelectedFeature(null) }}
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
          onClose={() => { setEduPopup(null); setSelectedFeature(null); setSelectedLane(null) }}
          onNavigate={handleEduNavigate}
        />
      )}
    </div>
  )
}

