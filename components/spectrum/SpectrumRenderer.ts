// Phase 12 — Full Spectrum Renderer Class
// Phase 15 — Visible Spectrum Gradient Rendering
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { FrequencyFeature, SpectrumBand, SpectrumCategory, SpectrumDetailDensity, SpectrumDetailLayers, SpectrumMode, ZoomState } from '@/types/spectrum'
import { F_MIN, LOG_RANGE, formatFrequency, freqToScreenX } from '@/lib/zoom/logMapper'
import { getLODLevel, getLODVisibility } from '@/lib/zoom/lodController'
import { wavelengthToPixiColor, BAND_COLORS } from '@/lib/pixi/colorMapper'
import { canvasFontFamily } from '@/lib/pixi/canvasFont'
import { SPECTRUM_LANE_BY_ID, SPECTRUM_LANES, getBandLane, getFeatureLane } from '@/lib/spectrumLanes'
import { PROFESSIONAL_SUB_BANDS, PROFESSIONAL_TECH_OVERLAYS, type ProfessionalTechnology } from '@/data/professionalSpectrum'
import { placeWithOverflow } from '@/lib/spectrum/clusterPlacement'
import { isFeatureAllowedByDetailLayers, isFeatureVisibleInMode } from '@/lib/spectrum/detailLayerClassifier'
import { EDUCATIONAL_EXAMPLES, isEduExampleVisible, type EducationalExample } from '@/data/educationalExamples'
import { useSpectrumStore } from '@/store/spectrumStore'
import {
  getEducationalSpacingForDensity,
  getFeatureZoomBoostForDensity,
  getProfessionalLabelSpacingForDensity,
  getProfessionalVisibilityThresholdForDensity,
  getProfessionalZoomBoostForDensity,
} from '@/lib/spectrum/detailDensityProfiles'

/** Screen-space box of a "+N" overflow badge, consumed by the canvas hit-test. */
export interface ClusterBadge {
  bx: number
  by: number
  w: number
  count: number
  centerFreq: number
}

const POOL_SIZE = 600
const TRACK_H_RATIO = 0.07      // track height as fraction of canvas height
const VISIBLE_STRIP_COUNT = 74  // 370nm range / 5nm steps
const DEFAULT_DETAIL_LAYERS: SpectrumDetailLayers = {
  pointsOfInterest: true,
  technologies: true,
  channels: true,
  regulations: true,
  hazards: true,
  natural: true,
}

export class SpectrumRenderer {
  private app: Application | null = null
  private lodContainers: Container[] = []
  private bandPool: Graphics[] = []
  private labelPool: Text[] = []
  private highlightGraphics: Graphics | null = null
  private axisGraphics: Graphics | null = null
  private signalGraphics: Graphics | null = null
  private visibleSpectrumContainer: Container | null = null
  private visibleStrips: Graphics[] = []
  private width = 0
  private height = 0
  private _initialized = false
  private _destroyed = false
  private _prefersReducedMotion = false
  private _signalFrameSkip = 0

  // Animation state
  private animating = false
  private animTarget: { center: number; zoom: number } | null = null
  private animProgress = 0
  private animDuration = 45  // ticks (~0.75s at 60fps)
  private animFrom: ZoomState | null = null
  onAnimationFrame?: (state: ZoomState) => void
  /** Screen-space geometry of the "+N" overflow badges, republished each frame so
   *  the canvas hit-test can make them clickable (zoom-to-expand). */
  eduClusters: ClusterBadge[] = []
  /** Same, for professional mode: collapsed tech overlays and stacked feature pins.
   *  Kept separate from eduClusters so each mode's hit-test only sees its own badges. */
  proClusters: ClusterBadge[] = []
  /** The professional tech-overlay diamonds actually drawn this frame, so the canvas
   *  hit-test can open a detail panel for exactly what is on screen (previously these
   *  markers were purely decorative — drawn but unclickable). */
  proMarkers: Array<{ x: number; y: number; tech: ProfessionalTechnology }> = []

  // Pending data from React — ticker reads these
  private _pendingBands: SpectrumBand[] = []
  private _pendingFeatures: FrequencyFeature[] = []
  private _pendingState: ZoomState = { centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 }
  private _pendingMode: SpectrumMode = 'educational'
  private _pendingDensity: SpectrumDetailDensity = 'details'
  private _pendingShowEM = true
  private _pendingShowApplications = true
  private _pendingShowHazards = true
  private _pendingDetailLayers: SpectrumDetailLayers = DEFAULT_DETAIL_LAYERS
  private _dirty = false

  // Hovered POI state — set from React on pointer move
  private _hoveredFeatureId: string | null = null
  private _selectedFeatureId: string | null = null
  private _focusedLaneId: SpectrumCategory | null = null
  private _selectedLaneId: SpectrumCategory | null = null

  setHoveredFeature(id: string | null): void {
    if (this._hoveredFeatureId !== id) {
      this._hoveredFeatureId = id
      this._dirty = true
    }
  }

  setSelectedFeature(id: string | null): void {
    if (this._selectedFeatureId !== id) {
      this._selectedFeatureId = id
      this._dirty = true
    }
  }

  setLaneFocus(focusedLaneId: SpectrumCategory | null, selectedLaneId: SpectrumCategory | null): void {
    if (this._focusedLaneId !== focusedLaneId || this._selectedLaneId !== selectedLaneId) {
      this._focusedLaneId = focusedLaneId
      this._selectedLaneId = selectedLaneId
      this._dirty = true
    }
  }

  constructor(private canvas: HTMLCanvasElement) {}

  async init(_allBands: SpectrumBand[]): Promise<void> {
    // Phase 22 — respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this._prefersReducedMotion = prefersReducedMotion
    this.animDuration = prefersReducedMotion ? 1 : 45

    // Local ref — this.app may be nulled by destroy() while we await
    const app = new Application()
    this.app = app

    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
    const baseWidth = this.canvas.clientWidth || 800
    const baseHeight = this.canvas.clientHeight || 400

    try {
      await app.init({
        canvas: this.canvas,
        width: baseWidth,
        height: baseHeight,
        backgroundColor: 0x050508,
        antialias: !isMobile,
        resolution: Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2),
        autoDensity: true,
        preference: 'webgl',
        // Refuse software rendering: on SwiftShader-class rasterizers the shader
        // compile blocks the main thread for so long the app appears frozen.
        // Better to fail fast here and let the caller drop to the 2D Safe Mode.
        failIfMajorPerformanceCaveat: true,
      })
    } catch {
      // Mobile fallback: minimum-cost WebGL init to avoid long "initializing" stalls.
      await app.init({
        canvas: this.canvas,
        width: baseWidth,
        height: baseHeight,
        backgroundColor: 0x050508,
        antialias: false,
        resolution: 1,
        autoDensity: true,
        preference: 'webgl',
        failIfMajorPerformanceCaveat: true,
      })
    }

    // Fast unmount: destroy() was called while init() was awaiting.
    // app.init() just completed so PixiJS internals (_cancelResize etc.) ARE wired —
    // safe to call app.destroy() now. Then bail out.
    if (this._destroyed) {
      this._safeDestroy(app)
      this.app = null
      return
    }

    this.width = this.app.screen.width
    this.height = this.app.screen.height

    // Axis layer (always visible, below bands)
    this.axisGraphics = new Graphics()
    this.app.stage.addChild(this.axisGraphics)
    this.signalGraphics = new Graphics()
    this.app.stage.addChild(this.signalGraphics)

    // LOD containers (0–10) — add all to stage, toggle .visible
    for (let i = 0; i < 11; i++) {
      const c = new Container()
      this.lodContainers.push(c)
      this.app.stage.addChild(c)
    }

    // Visible spectrum gradient overlay (Phase 15)
    this.visibleSpectrumContainer = new Container()
    this.app.stage.addChild(this.visibleSpectrumContainer)
    this._initVisibleStrips()

    // Highlight layer (above bands)
    this.highlightGraphics = new Graphics()
    this.app.stage.addChild(this.highlightGraphics)

    // Pre-allocate band Graphics pool
    for (let i = 0; i < POOL_SIZE; i++) {
      this.bandPool.push(new Graphics())
    }

    // Pre-allocate label Text pool
    const labelStyle = new TextStyle({
      fontFamily: canvasFontFamily(),
      fontSize: 11,
      fill: 0xffffff,
      fontWeight: '500',
    })
    for (let i = 0; i < POOL_SIZE; i++) {
      this.labelPool.push(new Text({ text: '', style: labelStyle, resolution: 2 }))
    }

    // Ticker — runs every frame
    this.app.ticker.add(() => this.onTick())
    this._initialized = true
  }

  // Phase 15 — pre-allocate visible spectrum strip Graphics, store color per strip
  private _initVisibleStrips(): void {
    if (!this.visibleSpectrumContainer) return
    for (let i = 0; i < VISIBLE_STRIP_COUNT; i++) {
      const g = new Graphics()
      this.visibleStrips.push(g)
      this.visibleSpectrumContainer.addChild(g)
    }
    this.visibleSpectrumContainer.visible = false
  }

  // Called from React on every visibleBands / zoomState change
  update(
    bands: SpectrumBand[],
    state: ZoomState,
    features: FrequencyFeature[] = [],
    mode: SpectrumMode = 'educational',
    density: SpectrumDetailDensity = 'details',
    showEM = true,
    showApplications = true,
    showHazards = true,
    detailLayers: SpectrumDetailLayers = DEFAULT_DETAIL_LAYERS,
  ): void {
    this._pendingBands = bands
    this._pendingFeatures = features
    this._pendingState = state
    this._pendingMode = mode
    this._pendingDensity = density
    this._pendingShowEM = showEM
    this._pendingShowApplications = showApplications
    this._pendingShowHazards = showHazards
    this._pendingDetailLayers = detailLayers
    this._dirty = true
  }

  private onTick(): void {
    if (this.animating) {
      this.tickAnimation()
    } else if (this._dirty) {
      this._dirty = false
      this.renderFrame(
        this._pendingBands, this._pendingState, this._pendingFeatures,
        this._pendingMode, this._pendingDensity,
        this._pendingShowEM, this._pendingShowApplications, this._pendingShowHazards,
        this._pendingDetailLayers,
      )
    } else if (!this._prefersReducedMotion) {
      this._signalFrameSkip = (this._signalFrameSkip + 1) % 4
      if (this._signalFrameSkip === 0) this._drawAnimatedBackground()
    }
  }

  private _drawAnimatedBackground(): void {
    if (!this.app || !this.signalGraphics || this.width <= 0 || this.height <= 0) return
    const { centerFrequency, zoomLevel } = this._pendingState
    this._drawSignalLayer(centerFrequency, zoomLevel, this.width, this.height, this._pendingMode)
  }

  private renderFrame(
    bands: SpectrumBand[],
    state: ZoomState,
    features: FrequencyFeature[] = [],
    mode: SpectrumMode = 'educational',
    density: SpectrumDetailDensity = 'details',
    showEM = true,
    showApplications = true,
    showHazards = true,
    detailLayers: SpectrumDetailLayers = DEFAULT_DETAIL_LAYERS,
  ): void {
    if (!this.app) return
    const { centerFrequency, zoomLevel, lodLevel } = state
    const W = this.width
    const H = this.height

    // Feature 6 — band spread: at zoom=1 (full view) tracks are 1.7× taller,
    // smoothly shrinking to 1× by zoom=8. Gives breathing room when fully zoomed out.
    const spreadFactor = 1 + 0.7 * Math.max(0, 1 - (zoomLevel - 1) / 7)
    const trackH = H * TRACK_H_RATIO * spreadFactor

    this._drawInstrumentBackground(centerFrequency, zoomLevel, W, H, mode)
    this._drawSignalLayer(centerFrequency, zoomLevel, W, H, mode)

    // Activate correct LOD container
    this.lodContainers.forEach((c, i) => {
      c.visible = i === lodLevel
      for (const child of Array.from(c.children)) {
        if (child instanceof Graphics) this.bandPool.push(child)
        else if (child instanceof Text) this.labelPool.push(child)
      }
      c.removeChildren()
    })
    const container = this.lodContainers[lodLevel]
    if (!container) return

    // Hide visible spectrum overlay until a visible band is found
    if (this.visibleSpectrumContainer) {
      this.visibleSpectrumContainer.visible = false
    }

    for (const band of bands) {
      const x1 = freqToScreenX(band.frequency_min, W, centerFrequency, zoomLevel)
      const x2 = freqToScreenX(band.frequency_max, W, centerFrequency, zoomLevel)
      const bw = Math.max(x2 - x1, 1)
      const lane = getBandLane(band)
      const y = H * lane.y

      // Phase 15 — visible spectrum: gradient strips at LOD 2+
      if (band.category === 'visible' && lodLevel >= 2 && bw > 10) {
        this._renderVisibleSpectrum(container, band, x1, x2, y, trackH)
        continue
      }

      const color = band.is_sound_overlay
        ? lane.pixiColor
        : (BAND_COLORS[band.category] ?? lane.pixiColor)

      const g = this.bandPool.pop() ?? new Graphics()
      g.clear()
      const visibility = getLODVisibility(band.lod_level, zoomLevel)
      if (visibility <= 0.02) continue
      this._drawBandRay(g, x1, x2, y, trackH, color, band.ionization_type === 'ionizing', band.is_sound_overlay, zoomLevel, visibility, mode)

      // Phase 8 — Ionizing hazard indicator at LOD 2+ (color + strip, not color alone)
      if (showHazards && band.ionization_type === 'ionizing' && lodLevel >= 2 && bw > 6) {
        g.rect(x1, y - trackH / 2, Math.min(bw, 4), trackH)
         .fill({ color: 0xFF006E, alpha: 0.9 })
      }

      container.addChild(g)
    }

    // Republished every frame — the canvas hit-test reads these to make what is
    // actually on screen clickable (badges zoom in, markers open a detail panel).
    this.proClusters = []
    this.proMarkers = []

    if (mode === 'professional' && showEM) {
      this._drawProfessionalSubBands(container, state, W, H)
    }
    if (mode === 'professional' && showApplications) {
      this._drawProfessionalTechnologies(container, state, W, H, density, detailLayers)
    }
    if (mode === 'educational' && showApplications) {
      this._drawEducationalExamples(container, state, W, H, density, detailLayers)
    }

    if (showApplications) {
      this._drawLaneFocusOverlay(container, W, H)
      this._drawFeatureMarkers(container, bands, features, state, W, H, mode, density, detailLayers)
    }
    this._drawAxis(centerFrequency, zoomLevel, W, H, mode)
  }

  private _drawLaneFocusOverlay(container: Container, W: number, H: number): void {
    const laneId = this._focusedLaneId ?? this._selectedLaneId
    if (!laneId) return

    const lane = SPECTRUM_LANE_BY_ID[laneId]
    if (!lane) return

    const isPreview = this._focusedLaneId === laneId
    const g = this.bandPool.pop() ?? new Graphics()
    g.clear()

    const y = H * lane.y
    const coreH = H * (isPreview ? 0.056 : 0.064)
    const auraH = coreH + H * 0.07
    const color = lane.pixiColor

    g.rect(0, y - auraH / 2, W, auraH).fill({ color, alpha: isPreview ? 0.045 : 0.062 })
    g.rect(0, y - coreH / 2, W, coreH).fill({ color, alpha: isPreview ? 0.105 : 0.145 })
    g.moveTo(0, y).lineTo(W, y).stroke({ color, alpha: isPreview ? 0.48 : 0.64, width: isPreview ? 1.4 : 2.1 })

    const beaconX = W - 12
    const beaconSize = isPreview ? 7 : 9
    g.moveTo(beaconX, y)
      .lineTo(beaconX - beaconSize, y - beaconSize * 0.65)
      .lineTo(beaconX - beaconSize, y + beaconSize * 0.65)
      .closePath()
      .fill({ color, alpha: isPreview ? 0.72 : 0.9 })

    container.addChild(g)
  }

  // Phase 15 — render visible spectrum as wavelength-accurate gradient strips
  private _drawInstrumentBackground(centerFrequency: number, zoomLevel: number, W: number, H: number, mode: SpectrumMode): void {
    if (!this.axisGraphics) return
    const g = this.axisGraphics
    g.clear()
    g.rect(0, 0, W, H).fill({ color: 0x02030a, alpha: 1 })

    const centerGlowY = H * 0.5
    for (let i = 0; i < 18; i++) {
      const alpha = Math.max(0, 0.08 - i * 0.004)
      const h = 18 + i * 26
      g.rect(0, centerGlowY - h / 2, W, h).fill({ color: i % 2 === 0 ? 0x061b2f : 0x140b2d, alpha })
    }

    const logCenter = Math.log10(Math.max(centerFrequency, F_MIN))
    const logSpan = LOG_RANGE / zoomLevel
    const logMin = logCenter - logSpan / 2
    const logMax = logCenter + logSpan / 2
    const firstTick = Math.floor(logMin)
    const lastTick = Math.ceil(logMax)
    const isProfessional = mode === 'professional'

    for (let decade = firstTick; decade <= lastTick; decade++) {
      const x = ((decade - logCenter) / logSpan + 0.5) * W
      if (x < -40 || x > W + 40) continue
      g.moveTo(x, 0).lineTo(x, H).stroke({ color: isProfessional ? 0x3a6f8f : 0x24445a, alpha: isProfessional ? 0.36 : 0.22, width: isProfessional ? 1.1 : 1 })

      if (zoomLevel > (isProfessional ? 3 : 8)) {
        for (let m = 2; m < 10; m++) {
          const minorLog = decade + Math.log10(m)
          const mx = ((minorLog - logCenter) / logSpan + 0.5) * W
          if (mx < 0 || mx > W) continue
          g.moveTo(mx, 0).lineTo(mx, H).stroke({ color: isProfessional ? 0x24445a : 0x1d2b3c, alpha: isProfessional ? 0.22 : 0.14, width: 0.5 })
        }
      }
    }

    for (const lane of SPECTRUM_LANES) {
      const y = H * lane.y
      const bandH = Math.max(28, H * TRACK_H_RATIO * 1.1)
      g.rect(0, y - bandH / 2, W, bandH)
        .fill({ color: lane.pixiColor, alpha: lane.id === 'sound' ? 0.028 : 0.022 })
      g.moveTo(0, y).lineTo(W, y)
        .stroke({ color: lane.pixiColor, alpha: lane.id === 'visible' ? 0.2 : 0.14, width: 0.8 })
    }
  }

  private _drawSignalLayer(centerFrequency: number, zoomLevel: number, W: number, H: number, mode: SpectrumMode): void {
    if (!this.signalGraphics) return
    const g = this.signalGraphics
    g.clear()
    const logCenter = Math.log10(Math.max(centerFrequency, F_MIN))
    const logSpan = LOG_RANGE / zoomLevel
    this._drawFrequencySignalField(g, logCenter, logSpan, zoomLevel, W, H, mode)
  }

  private _drawFrequencySignalField(
    g: Graphics,
    logCenter: number,
    logSpan: number,
    zoomLevel: number,
    W: number,
    H: number,
    mode: SpectrumMode
  ): void {
    const baseY = H * 0.52
    const fieldH = Math.max(72, Math.min(H * 0.28, 190))
    const samples = Math.max(120, Math.min(200, Math.floor(W / 9)))
    const time = this._prefersReducedMotion ? 0 : performance.now() * 0.001
    const zoomT = Math.max(0, Math.min(1, (zoomLevel - 1) / 18))
    const alphaScale = mode === 'professional' ? 0.72 : 1

    g.rect(0, baseY - fieldH / 2, W, fieldH)
      .fill({ color: 0x00d4ff, alpha: 0.012 * alphaScale })

    for (const lane of SPECTRUM_LANES) {
      const x1 = freqToScreenX(lane.frequencyMin, W, Math.pow(10, logCenter), LOG_RANGE / logSpan)
      const x2 = freqToScreenX(lane.frequencyMax, W, Math.pow(10, logCenter), LOG_RANGE / logSpan)
      const left = Math.max(0, Math.min(x1, x2))
      const right = Math.min(W, Math.max(x1, x2))
      if (right - left <= 2) continue
      g.rect(left, baseY - fieldH / 2, right - left, fieldH)
        .fill({ color: lane.id === 'visible' ? 0xcfefff : lane.pixiColor, alpha: (lane.id === 'sound' ? 0.006 : 0.009) * alphaScale })
    }

    g.moveTo(0, baseY).lineTo(W, baseY)
      .stroke({ color: 0x74d6ff, alpha: 0.07 * alphaScale, width: 0.8 })

    const traceColors = [0x74f7ff, 0x00ff88, 0x7c3cff, 0x00d4ff]
    for (let trace = 0; trace < 4; trace += 1) {
      const traceT = trace / 3
      const baseAlpha = (trace === 0 ? 0.2 : 0.092 - trace * 0.013) * alphaScale
      const baseWidth = trace === 0 ? 1.35 : 0.75
      const traceOffset = (trace - 1.5) * fieldH * 0.095
      g.moveTo(0, baseY + traceOffset)

      for (let i = 1; i <= samples; i += 1) {
        const x = (i / samples) * W
        const screenT = x / Math.max(W, 1)
        const edgeFade = 0.68 + Math.sin(Math.PI * screenT) * 0.32
        const logF = logCenter + (screenT - 0.5) * logSpan
        const frequency = Math.pow(10, logF)
        const lane = this._getSignalLaneForFrequency(frequency)
        const spectrumT = Math.max(0, Math.min(1, (logF - Math.log10(F_MIN)) / LOG_RANGE))
        const density = 0.9 + Math.pow(spectrumT, 1.45) * 6.2 + zoomT * 2.1
        const speed = 0.14 + spectrumT * 0.42 + trace * 0.035
        const lanePull = (lane.y - 0.52) * H * 0.11
        const amp = Math.max(8, Math.min(34, fieldH * (0.19 - traceT * 0.035))) * (0.88 + spectrumT * 0.28)
        const carrier = Math.sin(screenT * Math.PI * 2 * density + time * speed + trace * 1.9)
        const fine = Math.sin(logF * (3.4 + trace) + time * (0.18 + trace * 0.04)) * 0.22
        const y = baseY + lanePull + traceOffset + (carrier + fine) * amp * edgeFade
        g.lineTo(x, y)
      }

      g.stroke({ color: traceColors[trace], alpha: baseAlpha, width: baseWidth })
    }
  }

  private _getSignalLaneForFrequency(frequency: number) {
    if (frequency < 20_000) return SPECTRUM_LANE_BY_ID.sound
    if (frequency >= SPECTRUM_LANE_BY_ID.gamma.frequencyMin) return SPECTRUM_LANE_BY_ID.gamma
    return SPECTRUM_LANES.find(lane =>
      lane.id !== 'sound' &&
      lane.id !== 'gamma' &&
      frequency >= lane.frequencyMin &&
      frequency <= lane.frequencyMax
    ) ?? SPECTRUM_LANE_BY_ID.radio
  }

  private _drawBandRay(
    g: Graphics,
    x1: number,
    x2: number,
    y: number,
    trackH: number,
    color: number,
    ionizing: boolean,
    isSound: boolean,
    zoomLevel: number,
    visibility: number,
    mode: SpectrumMode
  ): void {
    const left = Math.max(-20, Math.min(x1, x2))
    const right = Math.min(this.width + 20, Math.max(x1, x2))
    const width = Math.max(right - left, 1)
    const isProfessional = mode === 'professional'
    const coreAlpha = (ionizing ? 0.48 : isSound ? 0.42 : isProfessional ? 0.26 : 0.36) * visibility
    const glowHeight = Math.max(8, trackH * (isSound ? 0.36 : isProfessional ? 0.26 : 0.5))
    const amplitudeScale = isProfessional ? 0.11 : 0.28
    const amplitude = Math.max(isProfessional ? 1 : 3, Math.min(trackH * amplitudeScale, 24 / Math.sqrt(zoomLevel)))
    const samples = Math.max(8, Math.min(96, Math.floor(width / 10)))

    g.rect(left, y - glowHeight / 2, width, glowHeight)
      .fill({ color, alpha: (isSound ? 0.055 : 0.075) * visibility })
    g.moveTo(left, y)
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const x = left + width * t
      const envelope = Math.sin(Math.PI * t)
      const wave = Math.sin(t * Math.PI * 2 * (1.5 + zoomLevel * 0.08))
      g.lineTo(x, y + wave * amplitude * envelope)
    }
    g.stroke({ color, alpha: coreAlpha, width: isSound ? 1.4 : isProfessional ? 1.1 : 1.8 })

    g.moveTo(left, y - glowHeight * 0.45).lineTo(left, y + glowHeight * 0.45)
      .stroke({ color, alpha: 0.35 * visibility, width: 1 })
    g.moveTo(right, y - glowHeight * 0.45).lineTo(right, y + glowHeight * 0.45)
      .stroke({ color, alpha: 0.35 * visibility, width: 1 })
  }

  private _drawFeatureMarkers(
    container: Container,
    bands: SpectrumBand[],
    features: FrequencyFeature[],
    state: ZoomState,
    W: number,
    H: number,
    mode: SpectrumMode,
    density: SpectrumDetailDensity,
    detailLayers: SpectrumDetailLayers
  ): void {
    const zoomBoost = getFeatureZoomBoostForDensity(density, mode)
    const lastLabelRightByLane = new Map<string, number>()
    // Positions of the pins we actually draw, so professional mode can report stacked
    // density with a "+N" badge (the pins themselves all stay drawn and clickable).
    const drawnByLane = new Map<string, { x: number; y: number; freq: number }[]>()
    const minLabelSpacing = density === 'max' ? 44 : density === 'details' ? 58 : 78
    const alwaysShowFrequencyLabels = density !== 'clean'
    const minLabelVisibility = density === 'max' ? 0.12 : density === 'details' ? 0.16 : 0.2

    for (const feature of features) {
      if (!isFeatureVisibleInMode(feature, mode)) continue
      if (!isFeatureAllowedByDetailLayers(feature, detailLayers)) continue

      // Smoothstep fade: eased S-curve instead of linear ramp
      const effectiveMinZoom = Math.max(1, feature.minZoom * zoomBoost)
      const fadeStart = effectiveMinZoom * 0.58
      const fadeEnd   = effectiveMinZoom * 1.25
      const t = Math.max(0, Math.min(1, (state.zoomLevel - fadeStart) / (fadeEnd - fadeStart)))
      const visibility = t * t * (3 - 2 * t)   // smoothstep
      if (visibility < 0.015) continue

      const x = freqToScreenX(feature.frequency_center, W, state.centerFrequency, state.zoomLevel)
      if (x < -60 || x > W + 60) continue

      const color = this._hexToPixi(feature.color)
      const lane = getFeatureLane(feature, bands)
      const pinBaseY = H * lane.y
      const marker = this.bandPool.pop() ?? new Graphics()
      marker.clear()

      const isHovered = this._hoveredFeatureId === feature.id
      const isSelected = this._selectedFeatureId === feature.id
      // Selected = full hover visuals (popup is open → show exactly what you clicked)
      const isActive = isHovered || isSelected
      const dotScale = isActive ? 1 + 0.9 * visibility : 1

      // Range visualization for wide features (>50 kHz)
      if (feature.frequency_bandwidth > 50000) {
        const half = feature.frequency_bandwidth / 2
        const x1 = freqToScreenX(Math.max(F_MIN, feature.frequency_center - half), W, state.centerFrequency, state.zoomLevel)
        const x2 = freqToScreenX(feature.frequency_center + half, W, state.centerFrequency, state.zoomLevel)
        const bw = Math.max(2, Math.min(Math.abs(x2 - x1), W * 0.8))
        const rangeAlpha = isActive ? 0.14 * visibility : 0.055 * visibility

        // Active: aura glow across the full range
        if (isActive) {
          const glowH = H * 0.055
          for (let i = 3; i >= 1; i--) {
            marker.rect(x - bw / 2 - i * 4, pinBaseY - glowH / 2 - i * 3, bw + i * 8, glowH + i * 6)
              .fill({ color, alpha: 0.018 * i * visibility })
          }
        }

        marker.rect(x - bw / 2, pinBaseY - H * 0.036, bw, H * 0.072)
          .fill({ color, alpha: rangeAlpha })

        // Range boundary triangles
        const triSize = isActive ? 7 : 5
        const triAlpha = (isActive ? 0.88 : 0.52) * visibility
        const triY = pinBaseY
        if (x1 > -20 && x1 < W + 20) {
          marker.moveTo(x1, triY - triSize)
                .lineTo(x1 - triSize * 0.6, triY + triSize * 0.4)
                .lineTo(x1 + triSize * 0.6, triY + triSize * 0.4)
                .closePath()
                .fill({ color, alpha: triAlpha })
        }
        if (x2 > -20 && x2 < W + 20) {
          marker.moveTo(x2, triY + triSize)
                .lineTo(x2 - triSize * 0.6, triY - triSize * 0.4)
                .lineTo(x2 + triSize * 0.6, triY - triSize * 0.4)
                .closePath()
                .fill({ color, alpha: triAlpha })
        }
      }

      // Glow rings around pin cap (hover = 3 rings, always shown when active)
      if (isActive) {
        for (let ring = 3; ring >= 1; ring--) {
          marker.circle(x, pinBaseY - 16, (2.5 + ring * 3.5) * dotScale)
            .fill({ color, alpha: 0.06 * ring * visibility })
        }
      }

      // Sharp vertical pin stem
      const pinTopY = pinBaseY - 16
      const stemAlpha = isActive ? 0.9 * visibility : 0.72 * visibility
      const stemWidth = isActive ? 1.8 : 1.2
      marker.moveTo(x, pinBaseY).lineTo(x, pinTopY)
        .stroke({ color, alpha: stemAlpha, width: stemWidth })

      // Pin cap
      const capR = 2.5 * dotScale
      marker.circle(x, pinTopY, capR).fill({ color, alpha: 0.95 * visibility })
      marker.circle(x, pinTopY, capR).stroke({ color: 0xffffff, alpha: (isActive ? 0.55 : 0.18) * visibility, width: isActive ? 1.0 : 0.5 })

      // Selected-only: extra outer orbit ring so "locked" state is distinct from transient hover
      if (isSelected) {
        marker.circle(x, pinTopY, capR + 5.8).stroke({ color, alpha: 0.62 * visibility, width: 1.4 })
        marker.circle(x, pinTopY, capR + 9.5).stroke({ color, alpha: 0.22 * visibility, width: 0.8 })
      }

      container.addChild(marker)

      {
        const list = drawnByLane.get(lane.id) ?? []
        list.push({ x, y: pinTopY, freq: feature.frequency_center })
        drawnByLane.set(lane.id, list)
      }

      if (!alwaysShowFrequencyLabels && !isActive) continue

      const laneId = lane.id
      const lastRight = lastLabelRightByLane.get(laneId) ?? -Infinity
      if (visibility < minLabelVisibility || x - lastRight < minLabelSpacing) continue

      const frequencyLabel = this.labelPool.pop() ?? new Text({ text: '' })
      frequencyLabel.text = formatFrequency(feature.frequency_center)
      frequencyLabel.x = x
      frequencyLabel.y = pinTopY - 8
      frequencyLabel.anchor.set(0.5, 1)
      frequencyLabel.style.fontSize = 8
      frequencyLabel.style.fill = 0xc6d3e8
      if (isActive) {
        frequencyLabel.alpha = 0.62
      } else {
        frequencyLabel.alpha = density === 'max' ? 0.36 : 0.3
      }
      container.addChild(frequencyLabel)

      const labelWidth = frequencyLabel.width
      lastLabelRightByLane.set(laneId, x + labelWidth / 2)
    }

    // Professional mode: report stacked pin density with the same "+N" badge the
    // educational lane uses. Educational mode already badges its own pins, so a second
    // badge family there would be noise rather than information.
    if (mode === 'professional') {
      for (const list of drawnByLane.values()) {
        // Pins stay drawn (and clickable) — the badge only reports how many stack here.
        for (const { anchor, count } of placeWithOverflow(list, minLabelSpacing).badges) {
          this._drawClusterBadge(container, anchor.x, anchor.y, count, anchor.freq, this.proClusters)
        }
      }
    }
  }

  private _drawProfessionalSubBands(container: Container, state: ZoomState, W: number, H: number): void {
    const minWidthForLabel = state.zoomLevel < 5 ? 56 : 34
    const occupiedByLane = new Map<string, number>()

    for (const band of PROFESSIONAL_SUB_BANDS) {
      const x1 = freqToScreenX(band.frequencyMin, W, state.centerFrequency, state.zoomLevel)
      const x2 = freqToScreenX(band.frequencyMax, W, state.centerFrequency, state.zoomLevel)
      if (x2 < -30 || x1 > W + 30) continue

      const lane = SPECTRUM_LANES.find(item => item.id === band.category)
      if (!lane) continue

      const y = H * lane.y
      const left = Math.max(0, Math.min(x1, x2))
      const right = Math.min(W, Math.max(x1, x2))
      const width = Math.max(right - left, 1)
      const color = this._hexToPixi(band.color)

      const g = this.bandPool.pop() ?? new Graphics()
      g.clear()
      g.moveTo(left, y + 15).lineTo(right, y + 15).stroke({ color, alpha: 0.32, width: 1 })
      g.moveTo(left, y + 10).lineTo(left, y + 20).stroke({ color, alpha: 0.28, width: 0.8 })
      g.moveTo(right, y + 10).lineTo(right, y + 20).stroke({ color, alpha: 0.28, width: 0.8 })
      container.addChild(g)

      const lastRight = occupiedByLane.get(band.category) ?? -Infinity
      const canLabel = width > minWidthForLabel && left - lastRight > 44
      if (!canLabel) continue

      const label = this.labelPool.pop() ?? new Text({ text: '' })
      label.text = state.zoomLevel >= 10 ? `${band.label} ${band.rangeLabel}` : band.label
      label.x = left + width / 2
      label.y = y + 30
      label.anchor.set(0.5)
      label.style.fontSize = state.zoomLevel >= 10 ? 10 : 9
      label.style.fill = color
      label.alpha = 0.88
      container.addChild(label)
      occupiedByLane.set(band.category, right)
    }
  }

  private _drawEducationalExamples(
    container: Container,
    state: ZoomState,
    W: number,
    H: number,
    density: SpectrumDetailDensity,
    detailLayers: SpectrumDetailLayers
  ): void {
    if (!detailLayers.pointsOfInterest && !detailLayers.technologies) return

    const minSpacing = getEducationalSpacingForDensity(density)
    const { eduHiddenDomains, eduVerifiedOnly } = useSpectrumStore.getState()

    // Collect the visible pins per lane, then place them greedily left→right.
    // Pins too close to the last placed one accumulate into a "+N" overflow badge
    // rather than disappearing silently — the density stays honest, and zooming in
    // separates them. (The hit-test still reaches each pin individually.)
    const perLane = new Map<string, { ex: EducationalExample; x: number; y: number }[]>()
    for (const example of EDUCATIONAL_EXAMPLES) {
      if (!isEduExampleVisible(example, eduHiddenDomains, eduVerifiedOnly)) continue
      const x = freqToScreenX(example.frequency, W, state.centerFrequency, state.zoomLevel)
      if (x < -30 || x > W + 30) continue
      const lane = SPECTRUM_LANES.find(item => item.id === example.category)
      if (!lane) continue
      const list = perLane.get(lane.id) ?? []
      list.push({ ex: example, x, y: H * lane.y })
      perLane.set(lane.id, list)
    }

    this.eduClusters = [] // republished each frame; read by the canvas hit-test
    for (const list of perLane.values()) {
      const { placed, badges } = placeWithOverflow(list, minSpacing, p => Math.max(70, p.ex.label.length * 6.4))
      for (const p of placed) this._drawEduPin(container, p.ex, p.x, p.y)
      for (const badge of badges) {
        const { anchor, count } = badge
        this._drawClusterBadge(container, anchor.x, anchor.y - 21, count, anchor.ex.frequency, this.eduClusters)
      }
    }
  }

  private _drawEduPin(container: Container, ex: EducationalExample, x: number, y: number): void {
    const g = this.bandPool.pop() ?? new Graphics()
    g.clear()
    g.moveTo(x, y - 20).lineTo(x, y - 6).stroke({ color: ex.color, alpha: 0.62, width: 1.2 })
    g.circle(x, y - 21, 3).fill({ color: ex.color, alpha: 0.92 })
    container.addChild(g)

    const label = this.labelPool.pop() ?? new Text({ text: '' })
    label.text = ex.label
    label.x = x
    label.y = y - 36
    label.anchor.set(0.5)
    label.style.fontSize = 10
    label.style.fill = ex.color
    label.alpha = 0.86
    container.addChild(label)
  }

  /** Draws a "+N" badge next to `x` at absolute `badgeY`, and records its box in `sink`
   *  so the hit-test can zoom-to-expand. Shared by every layer that collapses overlap. */
  private _drawClusterBadge(
    container: Container,
    x: number,
    badgeY: number,
    count: number,
    centerFreq: number,
    sink: ClusterBadge[]
  ): void {
    const w = 14 + String(count).length * 6
    const bx = x + 9
    const by = badgeY
    sink.push({ bx, by, w, count, centerFreq })
    const g = this.bandPool.pop() ?? new Graphics()
    g.clear()
    g.roundRect(bx, by - 7, w, 14, 7)
      .fill({ color: 0x14203a, alpha: 0.92 })
      .stroke({ color: 0x7ab8ff, width: 1, alpha: 0.7 })
    container.addChild(g)

    const t = this.labelPool.pop() ?? new Text({ text: '' })
    t.text = `+${count}`
    t.x = bx + w / 2
    t.y = by
    t.anchor.set(0.5)
    t.style.fontSize = 9
    t.style.fill = 0x9fc4ff
    t.alpha = 0.96
    container.addChild(t)
  }

  private _drawProfessionalTechnologies(
    container: Container,
    state: ZoomState,
    W: number,
    H: number,
    density: SpectrumDetailDensity,
    detailLayers: SpectrumDetailLayers
  ): void {
    if (!detailLayers.technologies) return

    const zoomBoost = getProfessionalZoomBoostForDensity(density)
    const minSpacing = getProfessionalLabelSpacingForDensity(density)
    const minVisibilityForLabel = getProfessionalVisibilityThresholdForDensity(density)

    // Collect what is in view per lane, then place greedily left→right. Overlapping
    // overlays collapse into a clickable "+N" badge instead of stacking diamonds with
    // silently-dropped labels — the same honest-density contract the educational lane
    // already had, which is what professional mode was missing.
    const perLane = new Map<string, { tech: ProfessionalTechnology; x: number; y: number; visibility: number }[]>()
    for (const tech of PROFESSIONAL_TECH_OVERLAYS) {
      const effectiveMinZoom = Math.max(1, tech.minZoom * zoomBoost)
      const zoomFade = Math.max(0, Math.min(1, (state.zoomLevel - effectiveMinZoom * 0.72) / (effectiveMinZoom * 0.36)))
      const visibility = zoomFade * zoomFade * (3 - 2 * zoomFade)
      if (visibility <= 0.02) continue

      const x = freqToScreenX(tech.frequency, W, state.centerFrequency, state.zoomLevel)
      if (x < -40 || x > W + 40) continue

      const lane = SPECTRUM_LANES.find(item => item.id === tech.category)
      if (!lane) continue

      const list = perLane.get(lane.id) ?? []
      list.push({ tech, x, y: H * lane.y, visibility })
      perLane.set(lane.id, list)
    }

    for (const list of perLane.values()) {
      const { placed, badges } = placeWithOverflow(list, minSpacing, p => Math.max(72, p.tech.label.length * 5.8))
      for (const p of placed) {
        this._drawTechOverlay(container, p.tech, p.x, p.y, p.visibility, state, W, p.visibility >= minVisibilityForLabel)
        // Only markers actually drawn become clickable — what you see is what you can open.
        this.proMarkers.push({ x: p.x, y: p.y, tech: p.tech })
      }
      for (const badge of badges) {
        const { anchor, count } = badge
        this._drawClusterBadge(container, anchor.x, anchor.y - 26, count, anchor.tech.frequency, this.proClusters)
      }
    }
  }

  private _drawTechOverlay(
    container: Container,
    tech: ProfessionalTechnology,
    x: number,
    y: number,
    visibility: number,
    state: ZoomState,
    W: number,
    showLabel: boolean
  ): void {
    {
      const color = this._hexToPixi(tech.color)
      const g = this.bandPool.pop() ?? new Graphics()
      g.clear()

      if (tech.bandwidth && tech.bandwidth > 1000) {
        const x1 = freqToScreenX(Math.max(1, tech.frequency - tech.bandwidth / 2), W, state.centerFrequency, state.zoomLevel)
        const x2 = freqToScreenX(tech.frequency + tech.bandwidth / 2, W, state.centerFrequency, state.zoomLevel)
        const width = Math.min(Math.max(Math.abs(x2 - x1), 2), 90)
        g.rect(x - width / 2, y - 18, width, 36).fill({ color, alpha: 0.032 * visibility })
      }

      // Dashed reference line (3 segments: top, middle gap, bottom)
      const lineAlpha = 0.32 * visibility
      g.moveTo(x, y - 26).lineTo(x, y - 8).stroke({ color, alpha: lineAlpha, width: 0.8 })
      g.moveTo(x, y - 4).lineTo(x, y + 4).stroke({ color, alpha: lineAlpha * 0.55, width: 0.7 })
      g.moveTo(x, y + 8).lineTo(x, y + 22).stroke({ color, alpha: lineAlpha, width: 0.8 })

      // Diamond (◆) marker — reference/non-selectable convention
      const dr = 4.2 * visibility + 3.0 * (1 - visibility)  // stays readable at low vis
      const diamondAlpha = 0.82 * visibility
      g.moveTo(x,      y - 26 - dr)   // top
       .lineTo(x + dr, y - 26)        // right
       .lineTo(x,      y - 26 + dr)   // bottom
       .lineTo(x - dr, y - 26)        // left
       .closePath()
       .fill({ color, alpha: diamondAlpha })
      // Hollow inner cutout for depth
      const ir = dr * 0.42
      g.moveTo(x,      y - 26 - ir)
       .lineTo(x + ir, y - 26)
       .lineTo(x,      y - 26 + ir)
       .lineTo(x - ir, y - 26)
       .closePath()
       .fill({ color: 0x050c18, alpha: 0.72 * visibility })
      // Thin outline ring
      g.moveTo(x,      y - 26 - dr)
       .lineTo(x + dr, y - 26)
       .lineTo(x,      y - 26 + dr)
       .lineTo(x - dr, y - 26)
       .closePath()
       .stroke({ color, alpha: 0.55 * visibility, width: 0.7 })

      container.addChild(g)

      if (!showLabel) return

      const label = this.labelPool.pop() ?? new Text({ text: '' })
      label.text = tech.label
      label.x = x
      label.y = y - 39
      label.anchor.set(0.5)
      label.style.fontSize = 9
      label.style.fill = color
      label.alpha = Math.min(0.9, visibility)
      container.addChild(label)
    }
  }

  private _hexToPixi(hex: string): number {
    return Number.parseInt(hex.replace('#', ''), 16)
  }

  private _renderVisibleSpectrum(
    container: Container,
    band: SpectrumBand,
    bandX1: number,
    bandX2: number,
    y: number,
    trackH: number
  ): void {
    const totalWidth = bandX2 - bandX1
    const stripWidth = totalWidth / VISIBLE_STRIP_COUNT
    const g = this.bandPool.pop() ?? new Graphics()
    g.clear()

    for (let i = 0; i < VISIBLE_STRIP_COUNT; i++) {
      const t = i / Math.max(VISIBLE_STRIP_COUNT - 1, 1)
      const nm = (band.wavelength_max + (band.wavelength_min - band.wavelength_max) * t) * 1e9
      const color = wavelengthToPixiColor(nm)
      g
        .rect(bandX1 + i * stripWidth, y - trackH / 2, stripWidth + 0.5, trackH)
        .fill({ color, alpha: 0.85 })
    }
    container.addChild(g)
  }

  private _drawAxis(center: number, zoom: number, W: number, H: number, mode: SpectrumMode): void {
    if (!this.axisGraphics) return
    const axisY = H * 0.965

    // Baseline
    this.axisGraphics.moveTo(0, axisY).lineTo(W, axisY)
    const isProfessional = mode === 'professional'
    this.axisGraphics.stroke({ color: isProfessional ? 0x4b7895 : 0x334455, width: isProfessional ? 0.8 : 0.5 })

    // Decade ticks (log10)
    const logCenter = Math.log10(Math.max(center, F_MIN))
    const logSpan = LOG_RANGE / zoom
    const logMin = Math.ceil(logCenter - logSpan / 2)
    const logMax = Math.floor(logCenter + logSpan / 2)

    for (let logF = logMin; logF <= logMax; logF++) {
      const f = Math.pow(10, logF)
      const x = freqToScreenX(f, W, center, zoom)
      if (x < 0 || x > W) continue
      const tickH = isProfessional ? (zoom >= 5 ? 16 : 9) : (zoom >= 5 ? 12 : 6)
      this.axisGraphics.moveTo(x, axisY - tickH).lineTo(x, axisY + tickH)
      this.axisGraphics.stroke({ color: isProfessional ? 0x5f8aa3 : 0x445566, width: isProfessional ? 0.8 : 0.5 })

      // Tick labels are rendered by the CSS HUD overlay to avoid per-frame Text alloc
    }
  }

  // Smooth animated navigation (used by search result selection)
  animateTo(targetFrequency: number, targetZoom: number, fromState: ZoomState): void {
    this.animFrom = { ...fromState }
    this.animTarget = { center: targetFrequency, zoom: targetZoom }
    this.animProgress = 0
    this.animating = true
  }

  private tickAnimation(): void {
    if (!this.animTarget || !this.animFrom) return
    this.animProgress++
    const t = this._easeInOut(this.animProgress / this.animDuration)
    const center = this._lerp(
      Math.log10(Math.max(this.animFrom.centerFrequency, F_MIN)),
      Math.log10(Math.max(this.animTarget.center, F_MIN)),
      t
    )
    const zoom = this._lerp(this.animFrom.zoomLevel, this.animTarget.zoom, t)
    const newState: ZoomState = {
      centerFrequency: Math.pow(10, center),
      zoomLevel: zoom,
      lodLevel: getLODLevel(zoom),
    }
    this.renderFrame(
      this._pendingBands, newState, this._pendingFeatures,
      this._pendingMode, this._pendingDensity,
      this._pendingShowEM, this._pendingShowApplications, this._pendingShowHazards,
      this._pendingDetailLayers,
    )
    // Notify store — keeps HUD, URL, layer data in sync during animation
    this.onAnimationFrame?.(newState)
    if (this.animProgress >= this.animDuration) {
      this.animating = false
      this.animTarget = null
    }
  }

  private _easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  private _lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  // Draw a highlight ring around the selected band
  highlightBand(band: SpectrumBand | null, state: ZoomState, showEM = true, showSound = true): void {
    if (!this.highlightGraphics) return
    this.highlightGraphics.clear()
    if (!band) return
    // Skip if the band's layer is currently hidden
    if (band.is_sound_overlay && !showSound) return
    if (!band.is_sound_overlay && !showEM) return
    const x1 = freqToScreenX(band.frequency_min, this.width, state.centerFrequency, state.zoomLevel)
    const x2 = freqToScreenX(band.frequency_max, this.width, state.centerFrequency, state.zoomLevel)
    const y = this.height * getBandLane(band).y
    const trackH = this.height * TRACK_H_RATIO
    this.highlightGraphics
      .roundRect(x1, y - trackH / 2, Math.max(x2 - x1, 2), trackH, 4)
      .stroke({ color: 0xffffff, alpha: 0.4, width: 1.5 })
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this._dirty = true
    if (!this._initialized || this._destroyed) return

    const renderer = this.app?.renderer
    if (!renderer || typeof renderer.resize !== 'function') return

    try {
      renderer.resize(width, height)
    } catch { /* WebGL context lost or not ready */ }
  }

  destroy(): void {
    this._destroyed = true
    const app = this.app
    this.app = null
    if (!app) return

    if (this._initialized) {
      // init() has fully completed — all PixiJS internals (ResizePlugin, _cancelResize,
      // WebGL renderer) are set up. Safe to call destroy.
      this._safeDestroy(app)
    } else {
      // init() is still awaiting. DO NOT call app.destroy() — PixiJS ResizePlugin hasn't
      // assigned _cancelResize yet and will throw "not a function".
      // Instead, just stop the ticker to prevent frame callbacks.
      // When init()'s await resolves it will see _destroyed=true and call app.destroy()
      // at that point (when internals ARE ready). See the _destroyed check in init().
      try { app.ticker?.stop() } catch { /* ticker may not exist yet */ }
    }
  }

  private _safeDestroy(app: Application): void {
    try {
      const maybeApp = app as Application & { _cancelResize?: unknown }
      if (typeof maybeApp._cancelResize !== 'function') {
        maybeApp._cancelResize = () => {}
      }
      app.destroy(false)
    } catch { /* ignore PixiJS teardown races */ }
  }
}
