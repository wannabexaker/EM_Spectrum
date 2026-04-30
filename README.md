# em-spectrum

Interactive visualization of the electromagnetic spectrum spanning 26 decades of frequency with infinite zoom, real-world technology overlay, and educational/professional content modes.

## Overview

This project renders the full EM spectrum (1 Hz to 10²⁶ Hz) as a navigable, zoomable canvas using logarithmic frequency mapping to distribute the full range across screen space. Users pan and zoom to explore frequency allocations, see wavelength equivalents, discover what technologies occupy each band (WiFi, GPS, 5G, medical imaging, etc.), and learn about physical interactions and hazards. A dual-mode system switches between accessible scientific explanations and technical detail. All data is static, rendered client-side via WebGL, and cached for offline access.

## Features

- Logarithmic pan and zoom across 26 frequency decades (1–50× magnification)
- 40+ electromagnetic bands with full metadata (applications, hazards, physical properties)
- 30+ real-world technologies mapped to spectrum regions (WiFi, GPS, 5G, fiber optics, X-ray, etc.)
- Educational/Professional content modes (toggleable verbosity in side panel)
- Frequency and wavelength unit switching (Hz, kHz, MHz, GHz, THz, etc. and nm, μm, mm)
- Search by band name, frequency string ("2.4 GHz", "1e9"), or wavelength ("550 nm")
- Deep linking: viewport state encoded in URL (?f=…&z=…) for sharing exact views
- Hazard layer overlay (red stripe on ionizing bands at zoom level 2+)
- Sound spectrum overlay (dashed border, distinct styling)
- Level-of-detail (LOD) system: bands hidden/shown dynamically based on zoom to maintain 60 fps
- Service Worker caching for offline browsing
- Mobile responsive (375px and up)
- Accessible components (Radix UI) with keyboard navigation

## Architecture

The visualizer splits into three layers: **state management** (Zustand store holding viewport), **interaction** (React hooks handling zoom/pan/search), and **rendering** (PixiJS WebGL engine with object pooling and LOD system).

Data flows from spectrum.json through a filtered band list (getBandsInViewport) into SpectrumRenderer, which batches and renders graphics via GPU. User interactions (mouse wheel, pointer drag, pinch touch) trigger zoom state updates, debounced URL encoding, and renderer re-renders. Animations are tweened over 45 frames (≈0.75s).

### Components

| Component | Role |
|---|---|
| SpectrumRenderer | PixiJS WebGL engine; maintains 300-object graphics pool, renders LOD-aware bands/labels/axis. Runs at 60 fps. |
| useZoom | React hook; manages centerFrequency, zoomLevel, lodLevel. Handles wheel/pinch/drag input, clamps viewport, debounces URL state. |
| useSpectrumData | Fetches spectrum.json, provides filtered band list for current viewport via getBandsInViewport(). |
| SpectrumCanvas | React wrapper around SpectrumRenderer canvas element. Lifecycle management and store subscription. |
| SidePanel | Framer Motion slide-in detail panel. Tabs: Overview, Applications, Hazards, Physics. Mode-aware verbosity. |
| FrequencyHUD | Live readout (center frequency, zoom level), unit toggle (Hz ↔ wavelength), copy-to-clipboard deep link. |
| SearchBar | Fuse.js fuzzy search + custom parser for frequency ("2.4 GHz") and wavelength ("550 nm"). Navigates viewport to results. |
| LayerToggle | Show/hide EM bands, sound overlay, applications layer, hazard overlays. |
| ModeToggle | Switch between Educational and Professional content verbosity. |
| UnitSwitcher | Cycle frequency/wavelength display units in HUD and search results. |

## Tech Stack

| Technology | Role |
|---|---|
| Next.js 16 | App Router, static site generation (SSG), SEO metadata |
| React 19 | Component framework |
| TypeScript 5 | Type safety |
| PixiJS 8 | WebGL rendering, 60 fps canvas, object pooling |
| Zustand 5 | State management (centerFrequency, zoomLevel, visibilityLayers, selectedBand) |
| Framer Motion 12 | Side panel slide animations |
| Tailwind CSS 4 | Utility-first styling |
| Fuse.js 7 | Client-side fuzzy search (band names) |
| Radix UI | Accessible components (Dialog, Slider, ToggleGroup, Tooltip) |
| next-themes 0.4 | Dark mode support |

## Installation

```bash
git clone https://github.com/yourusername/em-spectrum.git
cd em-spectrum
npm install
```

Requires Node.js 18+. All dependencies declared in package.json; no build configuration needed.

## Usage

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser. Navigate to /spectrum/ to see the full visualizer.

**Interactions:**
- **Scroll wheel**: zoom in/out (toward cursor)
- **Click + drag**: pan left/right across frequencies
- **Touch pinch**: zoom in/out (touch devices)
- **Right-click + drag** (or two-finger hold + drag on trackpad): fine-tune zoom
- **Search bar**: type band name, frequency ("2.4 GHz"), or wavelength ("550 nm")
- **Click a band**: open side panel with applications, hazards, physics details
- **Mode toggle**: switch between Educational and Professional explanations
- **Unit switcher**: cycle frequency units (Hz, kHz, MHz, GHz, THz) or wavelength (nm, μm, mm)
- **Share button**: copy deep link (encoded viewport state) to clipboard

Build for static export:

```bash
npm run build
```

Output is a fully static out/ directory (no server required). Suitable for CDN or static host.

## Project Structure

```
em-spectrum/
├── app/
│   ├── page.tsx              — landing page (sci-fi hero, feature cards)
│   ├── spectrum/page.tsx     — main spectrum visualizer
│   ├── [band]/page.tsx       — SSG band detail pages (/[band]/)
│   ├── layout.tsx            — root layout, theme provider, service worker registration
│   ├── globals.css           — CSS variables, Tailwind base styles
│   ├── robots.ts             — SEO robots.txt
│   └── sitemap.ts            — SEO sitemap.xml
├── components/
│   ├── spectrum/
│   │   ├── SpectrumRenderer.ts    — PixiJS engine (WebGL, object pool, LOD)
│   │   ├── SpectrumCanvas.tsx     — React wrapper, lifecycle
│   │   ├── SidePanel.tsx          — band detail panel (Framer Motion)
│   │   ├── BandLabel.tsx          — band label rendering
│   │   └── SpectrumErrorBoundary.tsx
│   ├── ui/
│   │   ├── SearchBar.tsx          — Fuse.js search + custom parser
│   │   ├── FrequencyHUD.tsx       — live readout, unit/deeplink controls
│   │   ├── LayerToggle.tsx        — visibility toggles
│   │   ├── ModeToggle.tsx         — Educational/Professional mode
│   │   ├── UnitSwitcher.tsx       — frequency/wavelength units
│   │   ├── SpectrumRuler.tsx      — axis markings
│   │   └── FeaturePopup.tsx       — tooltips
│   └── ServiceWorkerRegistrar.tsx
├── hooks/
│   ├── useZoom.ts            — viewport pan/zoom state, clamping, interaction handling
│   ├── useSpectrumData.ts    — band list filtering by viewport
│   ├── useViewport.ts        — URL state encoding/decoding
│   └── useSidePanel.ts       — selected band state
├── lib/
│   ├── zoom/
│   │   ├── logMapper.ts      — frequency ↔ pixel coordinate mapping (log₁₀)
│   │   ├── lodController.ts  — LOD level calculation by zoom
│   │   └── viewportManager.ts — clamp, pan, zoom math
│   ├── pixi/
│   │   └── colorMapper.ts    — band color selection, visible-spectrum gradient
│   ├── search/
│   │   └── frequencyParser.ts — "2.4 GHz", "550 nm" parsing
│   └── deeplink/
│       └── urlState.ts       — URL encoding/decoding (frequency + zoom)
├── data/
│   ├── spectrum.json         — 40+ EM bands (frequencies, wavelengths, metadata)
│   ├── technologies.json     — 30+ real-world technology definitions
│   └── frequencyFeatures.ts  — searchable band index
├── store/
│   └── spectrumStore.ts      — Zustand store (centerFrequency, zoomLevel, selectedBand, visibilityLayers)
├── types/
│   └── spectrum.ts           — TypeScript types (SpectrumBand, ZoomState, etc.)
├── public/
│   ├── sw.js                 — Service Worker (cache-first strategy)
│   ├── og/                   — OG image assets for social sharing
│   └── icons/                — favicon, app icons
├── docs/
│   ├── architecture.md       — component tree, data flow, tech rationale
│   ├── rendering.md          — PixiJS rendering details, LOD system
│   ├── zoom-engine.md        — logarithmic mapping mathematics
│   ├── data-model.md         — spectrum.json schema and invariants
│   ├── features.md           — implemented features and roadmap
│   ├── ui-ux.md              — design system, interaction patterns
│   ├── performance.md        — optimization notes, benchmarks
│   ├── deployment.md         — Vercel deployment, static export
│   └── roadmap.md            — Phase 2–4 planned features
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
└── README.md
```

## Notes

**Logarithmic frequency mapping is essential for visualization.** Linear screen-to-frequency would compress the low-frequency bands (ELF 3–30 Hz, SLF 30–300 Hz) to invisibly narrow slices. Log₁₀ distribution spreads all 26 decades evenly, making each decade occupy equal screen space.

**Object pooling in SpectrumRenderer prevents garbage collection pauses.** Pre-allocating 300 Graphics and Text objects and reusing them during LOD transitions keeps 60 fps smooth during rapid zoom interactions. GC pauses above 1 frame are perceptible and ruin the experience.

**Static export (no server) is deliberate.** Spectrum data is baked into the JS bundle at build time. There is no backend, no database, no real-time computation. This enables instant CDN distribution, offline browsing, and zero infrastructure cost. Suitable for educational use and open-source publication.

**Service Worker caching is opt-in via browser.** The app works online without it. When users visit while online, the Service Worker caches the bundle and spectrum.json. On subsequent offline visits, the cache is served. This is not a PWA in the full sense (no "install to home screen" UI), but offline fallback is functional.

**Deep linking via URL preserves viewport state.** When a user zooms to a specific frequency and wants to share that view, clicking "Copy deep link" encodes centerFrequency and zoomLevel into ?f=…&z=…. On return visit or share, the URL is parsed and viewport restored. This is debounced at 300ms to avoid excessive URL bar flashing during drag.

**Dual-mode content (Educational/Professional) lives in metadata, not separate routes.** The same SpectrumBand object contains both a plain-language description and detailed technical explanation. The side panel toggles between them via a Zustand flag. No code duplication, single source of truth.

**Search recognizes frequency and wavelength expressions without regex compilation.** A custom parser in requencyParser.ts recognizes patterns like "2.4 GHz", "1e9 Hz", "550 nm" without triggering the regex engine on every keystroke. This keeps search responsive in Fuse.js.

## Future Improvements

- Technology overlay rendered directly on canvas (Phase 2) — currently data is prepared but rendering pending; will display WiFi, GPS, 5G boxes on spectrum bands
- Visible-spectrum gradient shader (Phase 2) — currently visible light is colored but not with a true-spectrum gradient; WebGL shader planned
- Smooth LOD fade transitions (Phase 2) — LOD switches are currently instant; crossfade animations will smooth the experience
- Export as PNG/SVG (Phase 2) — user-triggered snapshot of current viewport
- 3D visualization mode (Phase 3) — alternative view with frequency, power, time axes
- Audio transposition (Phase 3) — hear each band's center frequency transposed into human hearing range
- Collaborative annotations (Phase 4) — users can add markers and notes; persistence TBD (server sync or localStorage)
