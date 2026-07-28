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
import { EduAtlasFilter } from '@/components/ui/EduAtlasFilter'
import { ProLayerFilter } from '@/components/ui/ProLayerFilter'
import { OnboardingTour } from '@/components/ui/OnboardingTour'
import { DetailDensityToggle } from '@/components/ui/DetailDensityToggle'
import { UnitSwitcher } from '@/components/ui/UnitSwitcher'
import { RegulatoryRegionToggle } from '@/components/ui/RegulatoryRegionToggle'
import { FrequencyHUD } from '@/components/ui/FrequencyHUD'
import { useSpectrumStore } from '@/store/spectrumStore'
import { decodeDetailDensityPreference, decodeViewportState } from '@/lib/deeplink/urlState'

export default function SpectrumPage() {
  useEffect(() => {
    useSpectrumStore.getState().hydrateLocalPreferences()
  }, [])

  // Phase 17 — initialize zoom from URL on mount (getState avoids subscribing)
  useEffect(() => {
    const saved = decodeViewportState()
    if (saved) {
      if (saved.detailDensity) {
        useSpectrumStore.getState().setDetailDensity(saved.detailDensity)
      }
      useSpectrumStore.getState().setZoom(saved.centerFrequency, saved.zoomLevel)
      return
    }

    const densityPref = decodeDetailDensityPreference()
    if (densityPref) {
      useSpectrumStore.getState().setDetailDensity(densityPref)
    }
  }, [])

  return (
    <div className="spectrum-layout">
      {/* Header */}
      <header className="spectrum-header" role="banner">
        {/* The page had no level-one heading, so assistive tech had nothing naming it.
            It lives inside the banner so it is not content stranded outside a landmark. */}
        <h1 className="sr-only">Electromagnetic spectrum visualizer</h1>
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
          <div className="header-sep" aria-hidden />
          <ModeToggle />
          <EduAtlasFilter />
          <ProLayerFilter />
          <UnitSwitcher />
          <RegulatoryRegionToggle />
        </nav>
      </header>

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
        <OnboardingTour />
      </main>

      {/* HUD */}
      <footer role="contentinfo">
        <FrequencyHUD />
      </footer>
    </div>
  )
}
