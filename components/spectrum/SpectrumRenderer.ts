// Phase 12 — Full Spectrum Renderer Class
// Phase 15 — Visible Spectrum Gradient Rendering
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { FrequencyFeature, SpectrumBand, ZoomState } from '@/types/spectrum'
import { LOG_RANGE, freqToScreenX } from '@/lib/zoom/logMapper'
import { getLODLevel, getLODVisibility } from '@/lib/zoom/lodController'
import { wavelengthToPixiColor, BAND_COLORS } from '@/lib/pixi/colorMapper'

const POOL_SIZE = 300
const BAND_TRACK_Y = 0.35       // EM spectrum: top 35% of canvas height
const SOUND_TRACK_Y = 0.80      // Sound overlay: bottom strip
const TRACK_H_RATIO = 0.18      // track height as fraction of canvas height
const VISIBLE_STRIP_COUNT = 74  // 370nm range / 5nm steps

export class SpectrumRenderer {
  private app: Application | null = null
  private lodContainers: Container[] = []
  private bandPool: Graphics[] = []
  private labelPool: Text[] = []
  private highlightGraphics: Graphics | null = null
  private axisGraphics: Graphics | null = null
  private visibleSpectrumContainer: Container | null = null
  private visibleStrips: Graphics[] = []
  private width = 0
  private height = 0
  private _initialized = false
  private _destroyed = false

  // Animation state
  private animating = false
  private animTarget: { center: number; zoom: number } | null = null
  private animProgress = 0
  private animDuration = 45  // ticks (~0.75s at 60fps)
  private animFrom: ZoomState | null = null
  onAnimationFrame?: (state: ZoomState) => void

  // Pending data from React — ticker reads these
  private _pendingBands: SpectrumBand[] = []
  private _pendingFeatures: FrequencyFeature[] = []
  private _pendingState: ZoomState = { centerFrequency: 1e9, zoomLevel: 1, lodLevel: 0 }
  private _dirty = false

  constructor(private canvas: HTMLCanvasElement) {}

  async init(_allBands: SpectrumBand[]): Promise<void> {
    // Phase 22 — respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.animDuration = prefersReducedMotion ? 1 : 45

    // Local ref — this.app may be nulled by destroy() while we await
    const app = new Application()
    this.app = app

    await app.init({
      canvas: this.canvas,
      width: this.canvas.clientWidth || 800,
      height: this.canvas.clientHeight || 400,
      backgroundColor: 0x050508,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

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

    // LOD containers (0–3) — add all to stage, toggle .visible
    for (let i = 0; i < 4; i++) {
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
      fontFamily: 'Space Grotesk, sans-serif',
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
  update(bands: SpectrumBand[], state: ZoomState, features: FrequencyFeature[] = []): void {
    this._pendingBands = bands
    this._pendingFeatures = features
    this._pendingState = state
    this._dirty = true
  }

  private onTick(): void {
    if (this.animating) {
      this.tickAnimation()
    } else if (this._dirty) {
      this._dirty = false
      this.renderFrame(this._pendingBands, this._pendingState, this._pendingFeatures)
    }
  }

  private renderFrame(bands: SpectrumBand[], state: ZoomState, features: FrequencyFeature[] = []): void {
    if (!this.app) return
    const { centerFrequency, zoomLevel, lodLevel } = state
    const W = this.width
    const H = this.height

    // Feature 6 — band spread: at zoom=1 (full view) tracks are 1.7× taller,
    // smoothly shrinking to 1× by zoom=8. Gives breathing room when fully zoomed out.
    const spreadFactor = 1 + 0.7 * Math.max(0, 1 - (zoomLevel - 1) / 7)
    const trackH = H * TRACK_H_RATIO * spreadFactor

    this._drawInstrumentBackground(centerFrequency, zoomLevel, W, H)

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
      const y = band.is_sound_overlay ? H * SOUND_TRACK_Y : H * BAND_TRACK_Y

      // Phase 15 — visible spectrum: gradient strips at LOD 2+
      if (band.category === 'visible' && lodLevel >= 2 && bw > 10) {
        this._renderVisibleSpectrum(x1, x2, y, trackH)
        // Still draw label if wide enough
        if (bw > 60) {
          const label = this.labelPool.pop() ?? new Text({ text: '' })
          label.text = band.label
          label.x = x1 + bw / 2
          label.y = y
          label.anchor.set(0.5)
          label.style.fill = 0xffffff
          container.addChild(label)
        }
        continue
      }

      const color = band.is_sound_overlay
        ? 0xFFD60A
        : (BAND_COLORS[band.category] ?? 0xffffff)

      const g = this.bandPool.pop() ?? new Graphics()
      g.clear()
      const visibility = getLODVisibility(band.lod_level, zoomLevel)
      if (visibility <= 0.02) continue
      this._drawBandRay(g, x1, x2, y, trackH, color, band.ionization_type === 'ionizing', band.is_sound_overlay, zoomLevel, visibility)

      // Phase 8 — Ionizing hazard indicator at LOD 2+ (color + strip, not color alone)
      if (band.ionization_type === 'ionizing' && lodLevel >= 2 && bw > 6) {
        g.rect(x1, y - trackH / 2, Math.min(bw, 4), trackH)
         .fill({ color: 0xFF006E, alpha: 0.9 })
      }

      container.addChild(g)

      // Label — only if band is wide enough and in LOD range
      if (bw > 40 && visibility > 0.45) {
        const label = this.labelPool.pop() ?? new Text({ text: '' })
        label.text = band.label
        label.x = x1 + bw / 2
        label.y = y
        label.anchor.set(0.5)
        label.style.fontSize = lodLevel >= 2 ? 11 : 9
        label.alpha = visibility
        label.style.fill = band.is_sound_overlay ? 0xFFD60A : color
        container.addChild(label)
      }
    }

    this._drawFeatureMarkers(container, features, state, W, H)
    this._drawAxis(centerFrequency, zoomLevel, W, H)
  }

  // Phase 15 — render visible spectrum as wavelength-accurate gradient strips
  private _drawInstrumentBackground(centerFrequency: number, zoomLevel: number, W: number, H: number): void {
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

    const logCenter = Math.log10(Math.max(centerFrequency, 1))
    const logSpan = LOG_RANGE / zoomLevel
    const logMin = logCenter - logSpan / 2
    const logMax = logCenter + logSpan / 2
    const firstTick = Math.floor(logMin)
    const lastTick = Math.ceil(logMax)

    for (let decade = firstTick; decade <= lastTick; decade++) {
      const x = ((decade - logCenter) / logSpan + 0.5) * W
      if (x < -40 || x > W + 40) continue
      g.moveTo(x, 0).lineTo(x, H).stroke({ color: 0x24445a, alpha: 0.22, width: 1 })

      if (zoomLevel > 8) {
        for (let m = 2; m < 10; m++) {
          const minorLog = decade + Math.log10(m)
          const mx = ((minorLog - logCenter) / logSpan + 0.5) * W
          if (mx < 0 || mx > W) continue
          g.moveTo(mx, 0).lineTo(mx, H).stroke({ color: 0x1d2b3c, alpha: 0.14, width: 0.5 })
        }
      }
    }

    for (let row = 1; row < 7; row++) {
      const y = (H / 7) * row
      g.moveTo(0, y).lineTo(W, y).stroke({ color: 0x243044, alpha: row === 4 ? 0.2 : 0.1, width: 0.5 })
    }

    const samples = 180
    const baseY = H * 0.52
    const amp = Math.max(10, Math.min(88, 120 / Math.sqrt(zoomLevel)))
    for (let lane = 0; lane < 3; lane++) {
      const color = lane === 0 ? 0x00f5d4 : lane === 1 ? 0x7c3cff : 0x00d4ff
      const phase = lane * 1.8 + performance.now() * 0.00035
      g.moveTo(0, baseY)
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * W
        const logF = logCenter + (x / W - 0.5) * logSpan
        const y = baseY + Math.sin(logF * 2.2 + phase) * amp * (1 - lane * 0.18)
        g.lineTo(x, y)
      }
      g.stroke({ color, alpha: lane === 0 ? 0.55 : 0.28, width: lane === 0 ? 2 : 1 })
    }
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
    visibility: number
  ): void {
    const left = Math.max(-20, Math.min(x1, x2))
    const right = Math.min(this.width + 20, Math.max(x1, x2))
    const width = Math.max(right - left, 1)
    const coreAlpha = (ionizing ? 0.48 : isSound ? 0.42 : 0.36) * visibility
    const glowHeight = Math.max(8, trackH * (isSound ? 0.36 : 0.5))
    const amplitude = Math.max(3, Math.min(trackH * 0.28, 24 / Math.sqrt(zoomLevel)))
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
    g.stroke({ color, alpha: coreAlpha, width: isSound ? 1.4 : 1.8 })

    g.moveTo(left, y - glowHeight * 0.45).lineTo(left, y + glowHeight * 0.45)
      .stroke({ color, alpha: 0.35 * visibility, width: 1 })
    g.moveTo(right, y - glowHeight * 0.45).lineTo(right, y + glowHeight * 0.45)
      .stroke({ color, alpha: 0.35 * visibility, width: 1 })
  }

  private _drawFeatureMarkers(
    container: Container,
    features: FrequencyFeature[],
    state: ZoomState,
    W: number,
    H: number
  ): void {
    for (const feature of features) {
      const fadeStart = feature.minZoom * 0.55
      const fadeEnd = feature.minZoom * 1.2
      const visibility = Math.max(0, Math.min(1, (state.zoomLevel - fadeStart) / (fadeEnd - fadeStart)))
      if (visibility <= 0.02) continue
      const half = feature.frequency_bandwidth / 2
      const min = Math.max(1, feature.frequency_center - half)
      const max = feature.frequency_center + half
      const x1 = freqToScreenX(min, W, state.centerFrequency, state.zoomLevel)
      const x2 = freqToScreenX(max, W, state.centerFrequency, state.zoomLevel)
      const x = freqToScreenX(feature.frequency_center, W, state.centerFrequency, state.zoomLevel)
      if (x < -80 || x > W + 80) continue

      const width = Math.max(2, Math.min(Math.abs(x2 - x1), 80))
      const color = this._hexToPixi(feature.color)
      const marker = this.bandPool.pop() ?? new Graphics()
      marker.clear()

      // Subtle band span fill + vertical guide
      marker.rect(x - width / 2, H * 0.18, width, H * 0.64).fill({ color, alpha: 0.04 * visibility })
      marker.moveTo(x, H * 0.18).lineTo(x, H * 0.82).stroke({ color, alpha: 0.45 * visibility, width: 0.8 })

      // POI dot — sits ON the EM spectrum track so it matches the click hit-test
      const dotY = H * BAND_TRACK_Y
      marker.circle(x, dotY, 8).fill({ color, alpha: 0.15 * visibility })  // outer halo
      marker.circle(x, dotY, 5).fill({ color, alpha: 0.90 * visibility })  // filled dot
      marker.circle(x, dotY, 5).stroke({ color: 0xffffff, alpha: 0.28 * visibility, width: 0.8 }) // rim
      container.addChild(marker)

      if (state.zoomLevel >= feature.minZoom + 2 && Math.abs(x2 - x1) > 4) {
        const label = this.labelPool.pop() ?? new Text({ text: '' })
        label.text = feature.shortLabel
        label.x = x
        label.y = H * 0.16 + ((Math.abs(Math.round(x)) % 3) * 14)
        label.anchor.set(0.5)
        label.style.fontSize = 10
        label.style.fill = color
        label.alpha = visibility
        container.addChild(label)
      }
    }
  }

  private _hexToPixi(hex: string): number {
    return Number.parseInt(hex.replace('#', ''), 16)
  }

  private _renderVisibleSpectrum(
    bandX1: number,
    bandX2: number,
    y: number,
    trackH: number
  ): void {
    if (!this.visibleSpectrumContainer) return
    const totalWidth = bandX2 - bandX1
    const stripWidth = totalWidth / VISIBLE_STRIP_COUNT

    for (let i = 0; i < VISIBLE_STRIP_COUNT; i++) {
      const strip = this.visibleStrips[i]
      if (!strip) continue
      const nm = 380 + i * 5
      const color = wavelengthToPixiColor(nm)
      strip.clear()
      strip
        .rect(bandX1 + i * stripWidth, y - trackH / 2, stripWidth + 0.5, trackH)
        .fill({ color, alpha: 0.85 })
    }
    this.visibleSpectrumContainer.visible = true
  }

  private _drawAxis(center: number, zoom: number, W: number, H: number): void {
    if (!this.axisGraphics) return
    const axisY = H * 0.62

    // Baseline
    this.axisGraphics.moveTo(0, axisY).lineTo(W, axisY)
    this.axisGraphics.stroke({ color: 0x334455, width: 0.5 })

    // Decade ticks (log10)
    const logCenter = Math.log10(Math.max(center, 1))
    const logSpan = LOG_RANGE / zoom
    const logMin = Math.ceil(logCenter - logSpan / 2)
    const logMax = Math.floor(logCenter + logSpan / 2)

    for (let logF = logMin; logF <= logMax; logF++) {
      const f = Math.pow(10, logF)
      const x = freqToScreenX(f, W, center, zoom)
      if (x < 0 || x > W) continue
      const tickH = zoom >= 5 ? 12 : 6
      this.axisGraphics.moveTo(x, axisY - tickH).lineTo(x, axisY + tickH)
      this.axisGraphics.stroke({ color: 0x445566, width: 0.5 })

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
      Math.log10(Math.max(this.animFrom.centerFrequency, 1)),
      Math.log10(Math.max(this.animTarget.center, 1)),
      t
    )
    const zoom = this._lerp(this.animFrom.zoomLevel, this.animTarget.zoom, t)
    const newState: ZoomState = {
      centerFrequency: Math.pow(10, center),
      zoomLevel: zoom,
      lodLevel: getLODLevel(zoom),
    }
    this.renderFrame(this._pendingBands, newState, this._pendingFeatures)
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
  highlightBand(band: SpectrumBand | null, state: ZoomState): void {
    if (!this.highlightGraphics) return
    this.highlightGraphics.clear()
    if (!band) return
    const x1 = freqToScreenX(band.frequency_min, this.width, state.centerFrequency, state.zoomLevel)
    const x2 = freqToScreenX(band.frequency_max, this.width, state.centerFrequency, state.zoomLevel)
    const y = band.is_sound_overlay ? this.height * SOUND_TRACK_Y : this.height * BAND_TRACK_Y
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
