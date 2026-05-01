'use client'
// Phase 5.3 — Spectrum Page Layout
// Phase 17 — URL state initialization
import { useEffect } from 'react'
import Link from 'next/link'
import { SpectrumCanvas } from '@/components/spectrum/SpectrumCanvas'
import { SpectrumErrorBoundary } from '@/components/spectrum/SpectrumErrorBoundary'
import { SidePanel } from '@/components/spectrum/SidePanel'
import { SearchBar } from '@/components/ui/SearchBar'
import { LayerToggle } from '@/components/ui/LayerToggle'
import { ModeToggle } from '@/components/ui/ModeToggle'
import { DetailDensityToggle } from '@/components/ui/DetailDensityToggle'
import { UnitSwitcher } from '@/components/ui/UnitSwitcher'
import { FrequencyHUD } from '@/components/ui/FrequencyHUD'
import { FilterStatusBanner } from '@/components/ui/FilterStatusBanner'
import { useSpectrumStore } from '@/store/spectrumStore'
import { decodeViewportState } from '@/lib/deeplink/urlState'

export default function SpectrumPage() {
  // Phase 17 — initialize zoom from URL on mount (getState avoids subscribing)
  useEffect(() => {
    const saved = decodeViewportState()
    if (saved) {
      useSpectrumStore.getState().setZoom(saved.centerFrequency, saved.zoomLevel)
    }
  }, [])

  return (
    <div className="spectrum-layout">
      {/* Header */}
      <header className="spectrum-header" role="banner">
        <Link href="/" className="header-logo" aria-label="EM Spectrum home">
          EM Spectrum
        </Link>

        <SearchBar />

        <nav
          className="header-controls"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginLeft: 'auto' }}
          aria-label="Visualization controls"
        >
          <LayerToggle />
          <DetailDensityToggle />
          <ModeToggle />
          <UnitSwitcher />
        </nav>
      </header>

      <FilterStatusBanner />

      {/* Canvas area */}
      <main
        className="canvas-area"
        role="main"
        aria-label="Electromagnetic spectrum visualizer"
      >
        <SpectrumErrorBoundary>
          <SpectrumCanvas />
        </SpectrumErrorBoundary>
        <SidePanel />
      </main>

      {/* HUD */}
      <footer role="contentinfo">
        <FrequencyHUD />
      </footer>
    </div>
  )
}
