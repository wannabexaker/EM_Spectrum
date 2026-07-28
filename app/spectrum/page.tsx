'use client'
// Phase 5.3 — Spectrum Page Layout
// Phase 17 — URL state initialization
import { useEffect, useState } from 'react'
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
import { CursorFrequencyToggle } from '@/components/ui/CursorFrequencyToggle'
import { RegulatoryRegionToggle } from '@/components/ui/RegulatoryRegionToggle'
import { FrequencyHUD } from '@/components/ui/FrequencyHUD'
import { useSpectrumStore } from '@/store/spectrumStore'
import { decodeDetailDensityPreference, decodeViewportState } from '@/lib/deeplink/urlState'

export default function SpectrumPage() {
  // Phones only: the controls collapse behind one button so they stop occupying a third
  // of the screen. Desktop ignores this entirely — the nav stays inline.
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    useSpectrumStore.getState().hydrateLocalPreferences()
  }, [])

  // Any pick inside the menu is a single decision, so close after it and hand the screen
  // straight back to the spectrum.
  useEffect(() => {
    if (!menuOpen) return
    const nav = document.getElementById('spectrum-controls')
    const onPick = (e: Event) => {
      const el = e.target as HTMLElement
      // Filter triggers open their own panel; leave the menu up for those.
      if (el.closest('.edu-filter-trigger')) return
      if (el.closest('button')) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    nav?.addEventListener('click', onPick)
    window.addEventListener('keydown', onKey)
    return () => {
      nav?.removeEventListener('click', onPick)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

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

        {/* Mode stays out of the menu: it decides what the whole canvas means, so it is
            the one control worth a permanent tap target on a phone. */}
        <div className="header-mode-inline">
          <ModeToggle />
        </div>

        <button
          className="header-menu-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-expanded={menuOpen}
          aria-controls="spectrum-controls"
          aria-label={menuOpen ? 'Close controls' : 'Open controls'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav
          id="spectrum-controls"
          className="header-controls"
          data-open={menuOpen}
          aria-label="Visualization controls"
        >
          <div className="menu-group" data-label="Layers">
            <LayerToggle />
          </div>
          <div className="menu-group" data-label="Detail">
            <DetailDensityToggle />
          </div>
          <div className="header-sep" aria-hidden />
          <div className="menu-group menu-group-mode" data-label="Mode">
            <ModeToggle />
          </div>
          <div className="menu-group" data-label="Filter">
            <EduAtlasFilter />
            <ProLayerFilter />
          </div>
          <div className="menu-group" data-label="Units">
            <UnitSwitcher />
          </div>
          <div className="menu-group menu-group-display" data-label="Display">
            <CursorFrequencyToggle />
          </div>
          {/* Region was display:none on phones, which quietly pinned every card's legal
              notes to "All". In the menu it works again. */}
          <div className="menu-group" data-label="Region">
            <RegulatoryRegionToggle />
          </div>
        </nav>

        {menuOpen && (
          <button
            className="header-menu-scrim"
            aria-label="Close controls"
            onClick={() => setMenuOpen(false)}
          />
        )}
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
