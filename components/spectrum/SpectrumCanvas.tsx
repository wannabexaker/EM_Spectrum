'use client'
// Phase 3.4 + Phase 18 — Canvas wrapper with loading state
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { SpectrumRenderer } from './SpectrumRenderer'
import { useZoom } from '@/hooks/useZoom'
import { useSpectrumData } from '@/hooks/useSpectrumData'
import { useViewport } from '@/hooks/useViewport'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { findNearestTechnology, findProfessionalBand, PROFESSIONAL_SUB_BANDS, PROFESSIONAL_TECH_OVERLAYS, type ProfessionalTechnology } from '@/data/professionalSpectrum'
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
import { ProInfoPopup, type ProTarget } from '@/components/ui/ProInfoPopup'
import { EDUCATIONAL_EXAMPLES, EDUCATIONAL_EXAMPLE_MAP, isEduExampleVisible } from '@/data/educationalExamples'
import { getCardParam, setCardParam } from '@/lib/deeplink/urlState'
import { canvasFontFamily } from '@/lib/pixi/canvasFont'
import { probeHardwareWebGL } from '@/lib/pixi/webglSupport'
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
  const eduHiddenDomains = useSpectrumStore(s => s.eduHiddenDomains)
  const eduVerifiedOnly = useSpectrumStore(s => s.eduVerifiedOnly)

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
        ctx.font = `${Math.min(11, Math.max(8, bw * 0.12))}px ${canvasFontFamily()}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = band.label.length > bw / 6 ? band.label.slice(0, Math.floor(bw / 6)) + '…' : band.label
        ctx.fillText(label, (left + right) / 2, y)
        ctx.globalAlpha = 1
      }
    }

    // Educational pins — the flagship layer must survive Safe Mode too.
    // Small ticks + dots per lane, honouring the same atlas filters as WebGL.
    const lastRightByLane = new Map<string, number>()
    for (const ex of EDUCATIONAL_EXAMPLES) {
      if (!isEduExampleVisible(ex, eduHiddenDomains, eduVerifiedOnly)) continue
      const lane = SPECTRUM_LANE_BY_ID[ex.category as keyof typeof SPECTRUM_LANE_BY_ID]
      if (!lane) continue
      const x = freqToScreenX(ex.frequency, w, zoomState.centerFrequency, zoomState.zoomLevel)
      if (x < -10 || x > w + 10) continue
      const lastRight = lastRightByLane.get(lane.id) ?? -Infinity
      if (x - lastRight < 7) continue
      lastRightByLane.set(lane.id, x)

      const y = h * lane.y
      const color = `#${ex.color.toString(16).padStart(6, '0')}`
      ctx.globalAlpha = 0.75
      ctx.strokeStyle = color
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x, y - trackH / 2 - 2)
      ctx.lineTo(x, y - trackH / 2 - 10)
      ctx.stroke()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y - trackH / 2 - 12, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // center guide line
    ctx.strokeStyle = 'rgba(116, 214, 255, 0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(w * 0.5, 0)
    ctx.lineTo(w * 0.5, h)
    ctx.stroke()
  }, [bands, zoomState, selectedBand, eduHiddenDomains, eduVerifiedOnly])

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

/** Anything the arrow keys can move between on the canvas. Keeping the payload in a
 *  discriminated union lets one navigation pass drive three different detail panels. */
type NavTarget =
  | { kind: 'feature'; id: string; frequency: number; laneId: string; feature: FrequencyFeature }
  | { kind: 'edu'; id: string; frequency: number; laneId: string; example: EducationalExample }
  | { kind: 'pro'; id: string; frequency: number; laneId: string; tech: ProfessionalTechnology }

export function SpectrumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<SpectrumRenderer | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null)
  const [popup, setPopup] = useState<{ feature: FrequencyFeature; x: number; y: number } | null>(null)
  const [eduPopup, setEduPopup] = useState<{ example: EducationalExample; x: number; y: number } | null>(null)
  const [proPopup, setProPopup] = useState<{ target: ProTarget; x: number; y: number } | null>(null)

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
  const eduHiddenDomains = useSpectrumStore(s => s.eduHiddenDomains)
  const eduVerifiedOnly = useSpectrumStore(s => s.eduVerifiedOnly)
  const pendingEduStoryId = useSpectrumStore(s => s.pendingEduStoryId)
  const openEducationalStory = useSpectrumStore(s => s.openEducationalStory)
  const pendingFeatureId = useSpectrumStore(s => s.pendingFeatureId)
  const openFeatureCard = useSpectrumStore(s => s.openFeatureCard)
  const pendingProId = useSpectrumStore(s => s.pendingProId)
  const openProCard = useSpectrumStore(s => s.openProCard)
  const setMode = useSpectrumStore(s => s.setMode)
  const setZoom = useSpectrumStore(s => s.setZoom)
  const displayUnit = useSpectrumStore(s => s.displayUnit)
  const showCursorFrequency = useSpectrumStore(s => s.showCursorFrequency)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const pointerMovedRef = useRef(false)
  /** Last target the arrows (or a click) landed on — the store only tracks feature ids,
   *  so educational and professional picks need their own cursor. */
  const navSelectedIdRef = useRef<string | null>(null)

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

  // Init renderer once canvas is mounted. Every device (including mobile) attempts
  // WebGL — modern phones handle PixiJS fine, and the timeout below is the safety
  // net that drops to the 2D Safe Mode only if init actually stalls or fails.
  useEffect(() => {
    if (!canvasRef.current) return

    // Pre-flight: refuse software rendering BEFORE PixiJS runs. On machines where
    // Chrome only offers SwiftShader, PixiJS init compiles shaders on the CPU and
    // blocks the main thread so hard that even the watchdog timers below cannot
    // fire — this synchronous probe is the only reliable escape hatch.
    const support = probeHardwareWebGL()
    if (!support.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronous capability verdict on mount; must run before any PixiJS work
      setInitError(`WebGL unavailable: ${support.reason ?? 'unknown'}`)
      setIsReady(false)
      return
    }

    const renderer = new SpectrumRenderer(canvasRef.current)
    rendererRef.current = renderer
    setInitError(null)
    // Give WebGL a fair chance (shader compilation can be slow on phones), then
    // fall back gracefully rather than hanging on the loading skeleton.
    const initTimer = window.setTimeout(() => {
      if (rendererRef.current !== renderer) return
      setInitError('Renderer initialization timed out')
      setIsReady(false)
    }, 3500)

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
  }, [retryCount])

  // Global watchdog: never stay forever in "INITIALIZING" state.
  useEffect(() => {
    if (isReady || initError) return
    const watchdog = window.setTimeout(() => {
      setInitError('Initialization watchdog fallback')
      setIsReady(false)
    }, 5000)
    return () => window.clearTimeout(watchdog)
  }, [isReady, initError])

  // Push band + state to renderer on every change
  useEffect(() => {
    rendererRef.current?.update(visibleBands, zoomState, visibleFeatures, activeMode, detailDensity, showEM, showApplications, showHazards, detailLayers)
  }, [visibleBands, visibleFeatures, zoomState, activeMode, detailDensity, showEM, showApplications, showHazards, detailLayers, eduHiddenDomains, eduVerifiedOnly])

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

    // Everything the arrow keys can land on. RF/atlas features were the only navigable
    // targets, so educational stories and professional allocations — the headline content
    // of each mode — were reachable by mouse only.
    const navTargets: NavTarget[] = [
      ...visibleFeatures.map(feature => ({
        kind: 'feature' as const,
        id: feature.id,
        frequency: feature.frequency_center,
        laneId: getFeatureLane(feature, allBands).id,
        feature,
      })),
      ...(activeMode === 'educational' && showApplications
        ? EDUCATIONAL_EXAMPLES
            .filter(example => isEduExampleVisible(example, eduHiddenDomains, eduVerifiedOnly))
            .map(example => ({
              kind: 'edu' as const,
              id: `edu:${example.id}`,
              frequency: example.frequency,
              laneId: example.category,
              example,
            }))
        : []),
      ...(activeMode === 'professional' && showApplications
        ? PROFESSIONAL_TECH_OVERLAYS.map(tech => ({
            kind: 'pro' as const,
            id: `pro:${tech.id}`,
            frequency: tech.frequency,
            laneId: tech.category,
            tech,
          }))
        : []),
    ]

    function selectFeature(feat: (typeof visibleFeatures)[number]) {
      const store = useSpectrumStore.getState()
      const lane = getFeatureLane(feat, allBands)
      navSelectedIdRef.current = feat.id
      commitZoom(feat.frequency_center, store.zoomLevel)
      store.setSelectedFeature(feat.id)
      store.setSelectedLane(lane.id)
      store.selectBand(null)
      setPopup({ feature: feat, x: width / 2, y: height * lane.y })
      setEduPopup(null)
      setProPopup(null)
    }

    function selectTarget(target: NavTarget) {
      if (target.kind === 'feature') {
        selectFeature(target.feature)
        return
      }
      const store = useSpectrumStore.getState()
      navSelectedIdRef.current = target.id
      const laneY = SPECTRUM_LANE_BY_ID[target.laneId as keyof typeof SPECTRUM_LANE_BY_ID]?.y ?? 0.4
      commitZoom(target.frequency, store.zoomLevel)
      store.selectBand(null)
      store.setSelectedFeature(null)
      if (target.kind === 'edu') {
        store.setSelectedLane(target.example.category)
        setPopup(null)
        setProPopup(null)
        setEduPopup({ example: target.example, x: width / 2, y: height * laneY })
      } else {
        store.setSelectedLane(target.tech.category)
        setPopup(null)
        setEduPopup(null)
        setProPopup({ target: { kind: 'tech', tech: target.tech }, x: width / 2, y: height * laneY })
      }
    }

    /** The target the arrows should move from: the last keyboard pick, else the selected pin. */
    function currentNavId(): string | null {
      return navSelectedIdRef.current ?? useSpectrumStore.getState().selectedFeatureId
    }

    function getLaneTargets(laneId: string) {
      return navTargets
        .filter(target => target.laneId === laneId)
        .sort((a, b) => a.frequency - b.frequency)
    }

    function getNearestTargetIndex(targets: NavTarget[], frequency: number): number {
      if (targets.length === 0) return -1
      const logTarget = Math.log10(Math.max(frequency, F_MIN))
      let bestIdx = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let i = 0; i < targets.length; i += 1) {
        const dist = Math.abs(Math.log10(Math.max(targets[i].frequency, F_MIN)) - logTarget)
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
          // Shift+Left/Right → prev/next navigable target by frequency
          if (navTargets.length === 0) return
          const sorted = [...navTargets].sort((a, b) => a.frequency - b.frequency)
          const navId = currentNavId()
          const foundIdx = navId ? sorted.findIndex(t => t.id === navId) : -1
          const curIdx = foundIdx !== -1 ? foundIdx : dir === 1 ? -1 : sorted.length
          const nextIdx = (curIdx + dir + sorted.length) % sorted.length
          e.preventDefault()
          e.stopImmediatePropagation()
          selectTarget(sorted[nextIdx])
        } else {
          // Shift+Up/Down → nearest target in the adjacent lane
          const laneIdx = getCurrentLaneIdx(store.centerFrequency)
          const adjIdx = laneIdx + dir
          if (adjIdx < 0 || adjIdx >= lanesOrdered.length) return
          const candidates = getLaneTargets(lanesOrdered[adjIdx].id)
          const nearestIdx = getNearestTargetIndex(candidates, store.centerFrequency)
          if (nearestIdx === -1) return
          e.preventDefault()
          e.stopImmediatePropagation()
          selectTarget(candidates[nearestIdx])
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

          const sorted = getLaneTargets(laneId)
          if (sorted.length === 0) return

          const navId = currentNavId()
          const foundIdx = navId ? sorted.findIndex(t => t.id === navId) : -1
          const idx = foundIdx !== -1 ? foundIdx : getNearestTargetIndex(sorted, store.centerFrequency)

          if (idx === -1) return
          const next = sorted[(idx + dir + sorted.length) % sorted.length]
          e.preventDefault()
          e.stopImmediatePropagation()
          selectTarget(next)
        }
      } else {
        // ArrowUp/Down: jump to adjacent lane at the same (clamped) frequency
        const laneIdx = getCurrentLaneIdx(store.centerFrequency)
        const adjIdx = laneIdx + dir
        if (adjIdx < 0 || adjIdx >= lanesOrdered.length) return
        const adjLane = lanesOrdered[adjIdx]

        const laneTargets = getLaneTargets(adjLane.id)
        if (laneTargets.length > 0) {
          const nearestIdx = getNearestTargetIndex(laneTargets, store.centerFrequency)
          if (nearestIdx !== -1) {
            e.preventDefault()
            e.stopImmediatePropagation()
            selectTarget(laneTargets[nearestIdx])
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
  }, [allBands, visibleBands, visibleFeatures, commitZoom, width, height, activeMode, showApplications, eduHiddenDomains, eduVerifiedOnly])

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
      // Reliable store-driven jump (the smooth animateTo can under-shoot when kicked
      // off from an effect/deep-link); centres the pin so the popup lines up.
      setZoom(example.frequency, targetZoom)
      const lane = SPECTRUM_LANE_BY_ID[example.category as keyof typeof SPECTRUM_LANE_BY_ID]
      const pinY = lane ? height * lane.y - 21 : height * 0.3
      setEduPopup({ example, x: width / 2, y: pinY })
    },
    [zoomState, width, height, setZoom]
  )

  // Keep the card deep-link param in sync with whichever detail panel is open, so the URL
  // in the address bar always reproduces what is on screen. Skip the first run so a
  // deep-linked param isn't wiped before it's read below.
  const cardSyncSkip = useRef(true)
  useEffect(() => {
    if (cardSyncSkip.current) { cardSyncSkip.current = false; return }
    if (eduPopup) setCardParam('edu', eduPopup.example.id)
    else if (popup) setCardParam('feature', popup.feature.id)
    else if (proPopup) {
      const { target } = proPopup
      setCardParam('pro', target.kind === 'tech' ? target.tech.id : target.band.id)
    }
    else setCardParam('edu', null) // nothing open — clears all card params
  }, [eduPopup, popup, proPopup])

  // Open a story on request from elsewhere (e.g. picking an educational search result).
  useEffect(() => {
    if (!pendingEduStoryId) return
    const ex = EDUCATIONAL_EXAMPLE_MAP.get(pendingEduStoryId)
    openEducationalStory(null)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fulfils a one-shot cross-component request (an educational search pick) after clearing it
    if (ex) handleEduNavigate(ex)
  }, [pendingEduStoryId, handleEduNavigate, openEducationalStory])

  // Open a deep-linked card once, after the renderer is ready. Feature and professional
  // cards go through the store bridges so there is a single open path per card type.
  const cardDeepLinkDone = useRef(false)
  useEffect(() => {
    if (!isReady || cardDeepLinkDone.current) return
    cardDeepLinkDone.current = true
    const card = getCardParam()
    if (!card) return
    if (card.kind === 'feature') { openFeatureCard(card.id); return }
    if (card.kind === 'pro') { openProCard(card.id); return }
    const ex = EDUCATIONAL_EXAMPLE_MAP.get(card.id)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time open of the deep-linked story after the async renderer is ready
    if (ex) handleEduNavigate(ex)
  }, [isReady, handleEduNavigate, openFeatureCard, openProCard])

  const handleFeatureNavigate = useCallback(
    (feature: FrequencyFeature) => {
      const lane = getFeatureLane(feature, visibleBands)
      const targetZoom = Math.max(zoomState.zoomLevel, Math.max(5, feature.minZoom * 0.85))
      setZoom(feature.frequency_center, targetZoom)
      setSelectedFeature(feature.id)
      setSelectedLane(lane.id)
      selectBand(null)
      setEduPopup(null)
      setProPopup(null)
      setPopup({ feature, x: width / 2, y: height * lane.y - 16 })
    },
    [visibleBands, zoomState, width, height, setSelectedFeature, setSelectedLane, selectBand, setZoom]
  )

  // Open an RF/atlas feature card on request (e.g. picking a technology search result).
  useEffect(() => {
    if (!pendingFeatureId) return
    const feature = frequencyFeatures.find(f => f.id === pendingFeatureId)
    openFeatureCard(null)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fulfils a one-shot cross-component request (an RF search pick) after clearing it
    if (feature) handleFeatureNavigate(feature)
  }, [pendingFeatureId, handleFeatureNavigate, openFeatureCard])

  // Open a professional allocation card on request (ITU sub-band or technology overlay).
  useEffect(() => {
    if (!pendingProId) return
    const tech = PROFESSIONAL_TECH_OVERLAYS.find(t => t.id === pendingProId)
    const band = tech ? undefined : PROFESSIONAL_SUB_BANDS.find(b => b.id === pendingProId)
    openProCard(null)
    if (!tech && !band) return
    const target: ProTarget = tech ? { kind: 'tech', tech } : { kind: 'band', band: band! }
    const category = tech ? tech.category : band!.category
    const frequency = tech ? tech.frequency : Math.sqrt(band!.frequencyMin * band!.frequencyMax)
    const laneY = SPECTRUM_LANE_BY_ID[category as keyof typeof SPECTRUM_LANE_BY_ID]?.y ?? 0.4
    // These markers only exist in professional mode — opening the card while educational
    // mode is active (e.g. from a ?pro= deep link) would describe something not drawn.
    if (useSpectrumStore.getState().activeMode !== 'professional') setMode('professional')
    setZoom(frequency, tech ? Math.max(tech.minZoom, 12) : 8)
    /* eslint-disable react-hooks/set-state-in-effect -- fulfils a one-shot cross-component
       request (a professional search pick) which is cleared above before any state is set */
    setPopup(null)
    setEduPopup(null)
    setProPopup({ target, x: width / 2, y: height * laneY })
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pendingProId, openProCard, setZoom, setMode, width, height])

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
      // #7 — fatter tap targets on touch / coarse-pointer devices.
      const touchPad = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 10 : 0

      // "+N" overflow badge → zoom in to separate whatever collapsed underneath it.
      // Educational badges come from story pins; professional badges from collapsed tech
      // overlays and stacked feature pins.
      const clusters = activeMode === 'educational'
        ? rendererRef.current?.eduClusters
        : rendererRef.current?.proClusters
      if (clusters && clusters.length > 0) {
        const cl = clusters.find(c =>
          x >= c.bx - touchPad && x <= c.bx + c.w + touchPad && Math.abs(y - c.by) < 9 + touchPad)
        if (cl) {
          const targetZoom = Math.min(Math.max(zoomState.zoomLevel * 3, 6), 5000)
          setZoom(cl.centerFreq, targetZoom)
          setPopup(null)
          setEduPopup(null)
          setProPopup(null)
          pointerDownRef.current = null
          return
        }
      }

      // Professional tech-overlay diamond → detail panel. Only markers the renderer
      // actually drew this frame are hit-tested, so a click always matches what is on
      // screen (these markers used to be decorative and unreachable).
      if (activeMode === 'professional') {
        const techHit = rendererRef.current?.proMarkers.find(m =>
          Math.abs(x - m.x) < 11 + touchPad && Math.abs(y - (m.y - 26)) < 12 + touchPad)
        if (techHit) {
          navSelectedIdRef.current = `pro:${techHit.tech.id}`
          setPopup(null)
          setEduPopup(null)
          setProPopup({ target: { kind: 'tech', tech: techHit.tech }, x, y })
          setSelectedFeature(null)
          setSelectedLane(techHit.tech.category)
          pointerDownRef.current = null
          return
        }
      }

      // Educational pin hit test
      if (activeMode === 'educational' && detailDensity !== 'clean' && showApplications &&
          (detailLayers.pointsOfInterest || detailLayers.technologies)) {
        const eduHit = EDUCATIONAL_EXAMPLES.find(ex => {
          if (!isEduExampleVisible(ex, eduHiddenDomains, eduVerifiedOnly)) return false
          const lane = SPECTRUM_LANE_BY_ID[ex.category as keyof typeof SPECTRUM_LANE_BY_ID]
          if (!lane) return false
          const pinX = freqToScreenX(ex.frequency, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)
          const pinY = rect.height * lane.y - 21
          return Math.abs(x - pinX) < 12 + touchPad && Math.abs(y - pinY) < 14 + touchPad
        })
        if (eduHit) {
          navSelectedIdRef.current = `edu:${eduHit.id}`
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
        return Math.abs(x - dotX) < 14 + touchPad && Math.abs(y - dotY) < 16 + touchPad
      })
      if (featureHit) {
        navSelectedIdRef.current = featureHit.id
        setPopup({ feature: featureHit, x, y })
        setSelectedFeature(featureHit.id)
        setSelectedLane(getFeatureLane(featureHit, visibleBands).id)
        pointerDownRef.current = null
        return
      }

      const clickFreq = screenXToFreq(x, rect.width, zoomState.centerFrequency, zoomState.zoomLevel)

      // Professional ITU sub-band bracket, drawn just below the lane centre → detail panel.
      // Deliberately a narrow y-window so it can't steal ordinary band-track clicks.
      if (activeMode === 'professional') {
        const bracketLane = SPECTRUM_LANES.find(l => Math.abs(y - (rect.height * l.y + 15)) < 8 + touchPad)
        const subBand = bracketLane
          ? PROFESSIONAL_SUB_BANDS.find(b =>
              b.category === bracketLane.id && clickFreq >= b.frequencyMin && clickFreq <= b.frequencyMax)
          : undefined
        if (subBand) {
          setPopup(null)
          setEduPopup(null)
          setProPopup({ target: { kind: 'band', band: subBand }, x, y })
          pointerDownRef.current = null
          return
        }
      }

      // Band click — check frequency (x) AND lane y so clicks on the Sound
      // track don't accidentally select a Radio band at the same frequency
      setPopup(null)
      setEduPopup(null)
      setProPopup(null)
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
        navSelectedIdRef.current = null
      }
      pointerDownRef.current = null
    },
    [activeMode, detailDensity, detailLayers, showApplications, visibleBands, visibleFeatures, zoomState, selectBand, setSelectedFeature, setSelectedLane, eduHiddenDomains, eduVerifiedOnly, setZoom]
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
      {!isReady && !initError && (
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

      {initError && (
        <>
          <SpectrumCanvasFallback
            bands={visibleBands}
            zoomState={zoomState}
            selectedBand={selectedBand}
          />
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-3 rounded-lg border border-[#74d6ff20] bg-[#0b0d18d0] p-2 text-xs text-[#aebcda]">
            <span>Lightweight mode · drag to pan · pinch to zoom</span>
            <button
              onClick={() => { setInitError(null); setIsReady(false); setRetryCount(c => c + 1) }}
              className="shrink-0 rounded-md border border-[#74d6ff55] bg-[#74d6ff18] px-3 py-1 font-medium text-[#dff7ff] transition-colors hover:bg-[#74d6ff30]"
            >
              Try interactive mode ↻
            </button>
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

      {/* Professional marker popup (ITU sub-bands + technology allocations) */}
      {proPopup && (
        <ProInfoPopup
          target={proPopup.target}
          x={proPopup.x}
          y={proPopup.y}
          canvasW={width}
          canvasH={height}
          onClose={() => { setProPopup(null); setSelectedLane(null) }}
          onZoom={(frequency) => {
            setZoom(frequency, Math.min(Math.max(zoomState.zoomLevel * 3, 12), 5000))
            setProPopup(null)
          }}
        />
      )}
    </div>
  )
}

