# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # dev server with Turbopack on :3000
npm run build          # static export → out/ (production)
npm run lint           # ESLint 9 (flat config; baseline is 0 errors, some warnings)
npm run typecheck      # tsc --noEmit
npm run test           # Vitest (unit tests for zoom math + educational-data invariants)
npm run validate:data  # educational-data lane/integrity check
npm run check:sources  # HTTP-verify every source URL (needs network)
```

Turbopack source maps may show wrong line numbers — trust runtime behavior over what the overlay claims.

## What This Is

Interactive EM spectrum visualizer: 40 decades of frequency (10⁻¹⁴ Hz → 10²⁶ Hz) rendered on a PixiJS WebGL canvas inside a Next.js static export. Users pan/zoom the log-scale spectrum, click bands to see details in a slide-in side panel. The axis also carries a bottom "Audio / mechanical" (`sound`) lane for non-EM oscillations that share the frequency axis but not the medium.

**Stack:** Next.js 16.2.4 (App Router, `output: 'export'`), React 19.2.4, PixiJS v8.18.1, Zustand 5.0.12, Framer Motion, Fuse.js (fuzzy search), Tailwind v4.

## Architecture

```
app/                    Next.js App Router pages
  spectrum/page.tsx     main canvas page
  [band]/page.tsx       static band deep-link pages
components/spectrum/    all UI components
  SpectrumCanvas.tsx    React canvas wrapper — owns renderer lifecycle
  SpectrumRenderer.ts   PixiJS renderer class — all WebGL drawing
  SidePanel.tsx         slide-in band detail panel
  HUD.tsx               frequency axis overlay (CSS, not PixiJS)
hooks/
  useZoom.ts            pan/zoom/keyboard interactions
  useSidePanel.ts       panel open/close state
store/spectrumStore.ts  Zustand state
lib/zoom/
  logMapper.ts          core log10 frequency math
  lodController.ts      LOD level from zoom
  viewportFilter.ts     getBandsInViewport()
lib/pixi/colorMapper.ts band color lookup + wavelength→RGB
data/bands.ts           all EM band definitions
types/spectrum.ts       SpectrumBand, ZoomState types
```

## Critical Patterns

### Zustand store — vanilla pattern
Uses `createStore` + manual `useStore`, NOT `create()`. This is required for stable `getServerSnapshot` in React 19.

```typescript
const spectrumVanillaStore = createStore<SpectrumStore>()(...)
export const useSpectrumStore = Object.assign(_useSpectrumStore, {
  getState: () => spectrumVanillaStore.getState(),
})
```

### React ↔ PixiJS lifecycle (React Strict Mode safe)
`SpectrumCanvas.tsx` mounts the canvas. `SpectrumRenderer.ts` owns the PixiJS `Application`.

Key flags: `_initialized` (set after `await app.init()`) and `_destroyed` (set immediately on `destroy()`).

**Strict Mode race**: cleanup fires before `app.init()` resolves. Fix: check `_destroyed` after the await and call `_safeDestroy()` if set.

**WebGL context release**: always call `app.destroy(false)` (not just ticker stop) to free the WebGL context for Strict Mode's second mount.

**`_safeDestroy()`**: patches `_cancelResize` to a no-op before calling `app.destroy()` — PixiJS v8 `ResizePlugin.destroy()` unconditionally calls `_cancelResize()` which is null before init completes.

### Dirty-flag rendering
React calls `renderer.update(bands, state)` which sets `_dirty = true`. The PixiJS ticker reads `_dirty` each frame — never render synchronously from React.

`resize()` also sets `_dirty = true` first, then calls `app.renderer.resize()` wrapped in try/catch (WebGL context may not be ready).

### Log10 frequency math
`freqToScreenX(freq, W, centerFrequency, zoomLevel)` — all frequency positioning is log10.  
`logSpan = LOG_RANGE / zoomLevel`, where `LOG_RANGE = LOG_MAX − LOG_MIN = 26 − (−14) = 40` decades (`F_MIN = 1e-14`, `F_MAX = 1e26`, see `lib/zoom/logMapper.ts`).  
Never do linear interpolation on raw frequency values.

### LOD system
4 levels (0–3). `getLODLevel(zoomLevel)` from `lib/zoom/lodController.ts`. Each LOD level has its own PixiJS `Container`; only the active one is `.visible = true`. Band Graphics/Text come from pre-allocated pools (size 300).

### URL state
`?f=<freq>&z=<zoom>` decoded on mount. Deep links generated in `SidePanel.tsx` `copyDeepLink()`.

## Data invariants (educational examples)

`data/educationalExamples.ts` pins are placed by `category` → lane (see `SpectrumRenderer._drawEducationalPins` and the hit-test in `SpectrumCanvas`). Hard rule: any phenomenon that is **not electromagnetic** (acoustic, seismic, mechanical, orbital/cyclic, bioelectric rhythm) must use `category: 'sound'`, never an EM lane (`radio`…`gamma`) — an acoustic frequency in Hz overlaps the radio ELF band numerically but is a different medium.

`npm run validate:data` (`scripts/validate-educational-data.mjs`) enforces this: it fails on any frequency outside its lane's numeric range and on any non-EM-looking entry still parked on `radio`/`microwave`. Run it after editing that file.

Each entry also carries `confidence` (ScientificConfidence), `atlasCategory` (domain), and `sources[]` (verifiable links, surfaced in the popup). `npm run check:sources` HTTP-checks every source URL — run it after adding or editing sources; a dead link undermines the credibility the sources exist to provide.

## Graphify

Knowledge graph at `graphify-out/`. God nodes: `SpectrumRenderer` (16 edges), `search()` (7 edges).  
Read `graphify-out/GRAPH_REPORT.md` before answering architecture questions.

## PRD Goals (22 Phases)

The project was built phase-by-phase. Implemented phases include: log-scale PixiJS canvas, LOD system, band pool, zoom/pan with keyboard nav, visible spectrum gradient (Phase 15), sound overlay track, ionizing radiation hazard indicator, side panel with tabs, fuzzy search, URL deep links, `prefers-reduced-motion` support, animated navigation (`animateTo`), service worker / offline support, static band pages for SEO.
