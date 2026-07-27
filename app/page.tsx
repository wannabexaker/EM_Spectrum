'use client'

import Link from 'next/link'
import { useState } from 'react'
import ShaderBackground from '@/components/ui/shader-background'

export default function LandingPage() {
  const [currentFloor, setCurrentFloor] = useState<1 | 2 | 3>(1)

  return (
    <div className="landing-page" style={{ background: 'transparent' }}>
      <ShaderBackground />
      <div className="starfield" aria-hidden />
      <div className="scanlines" aria-hidden />

      <main className="landing-content">
        {/* Floor 1: Hero */}
        {currentFloor === 1 && (
          <section className="landing-floor landing-floor-1" aria-label="EM Spectrum introduction">
            <p className="landing-eyebrow">Interactive Science Visualization</p>

            <h1 className="landing-title">The Electromagnetic Spectrum</h1>

            <p className="landing-subtitle">
              From 10⁻¹⁴ Hz to 10²⁶ Hz — explore every frequency in the universe.
              Infinite zoom. Real-world applications.
              <br />
              Full physics detail.
            </p>

            <div className="spectrum-preview" aria-label="Spectrum preview" role="img" />

            <div className="cta-group">
              <button
                className="floor-toggle-btn"
                onClick={() => setCurrentFloor(2)}
                aria-label="Show controls and features"
                title="Keyboard shortcuts and highlights"
              >
                ↓
              </button>
              <Link href="/spectrum/" className="cta-button">
                Explore the Spectrum →
              </Link>
            </div>
          </section>
        )}

        {/* Floor 2: Controls */}
        {currentFloor === 2 && (
          <section className="landing-floor landing-floor-2" aria-label="Quick controls">
            <div className="floor-nav-row" role="group" aria-label="Floor navigation">
              <button
                className="floor-toggle-btn floor-toggle-up"
                onClick={() => setCurrentFloor(1)}
                aria-label="Return to introduction"
                title="Back to introduction"
              >
                ↑
              </button>
              <button
                className="floor-toggle-btn floor-toggle-down"
                onClick={() => setCurrentFloor(3)}
                aria-label="Show highlights"
                title="Go to highlights"
              >
                ↓
              </button>
            </div>

            <div className="floor-2-content">
              <div className="controls-guide" aria-label="Spectrum controls quick reference">
                <h2 className="controls-guide-title">Controls Quick Guide</h2>
                <div className="controls-guide-grid">
                  <div className="controls-guide-item">
                    <strong>Arrow Keys</strong>
                    <span>Left/Right move inside the same lane. Up/Down switch lane.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Shift + Arrows</strong>
                    <span>Jump between nearby POIs and across adjacent lanes.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Search (Ctrl/Cmd + K)</strong>
                    <span>Find bands, tech, and relations. Tab cycles related results.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Left Click / Tap</strong>
                    <span>Select bands or POIs and open details instantly.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Wheel / Pinch</strong>
                    <span>Log zoom centered at cursor (or pinch center on mobile).</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Drag</strong>
                    <span>Pan across decades. Right-drag on canvas = precise zoom.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Right Column Labels</strong>
                    <span>Click lane label to navigate there. Right-click for frequency menu.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Layers & Density</strong>
                    <span>Toggle EM/Sound/Apps/Hazards and switch Low/Mid/High detail.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Floor 3: Highlights */}
        {currentFloor === 3 && (
          <section className="landing-floor landing-floor-3" aria-label="Spectrum highlights">
            <div className="floor-nav-row" role="group" aria-label="Floor navigation">
              <button
                className="floor-toggle-btn floor-toggle-up"
                onClick={() => setCurrentFloor(2)}
                aria-label="Return to controls"
                title="Back to controls"
              >
                ↑
              </button>
            </div>

            <div className="floor-3-content">
              <div className="feature-cards">
                <div className="feature-card">
                  <div className="feature-card-icon">📡</div>
                  <h2 className="feature-card-title">26 Decades</h2>
                  <p className="feature-card-desc">
                    Radio waves to cosmic gamma rays — all 10²⁶ Hz of the known
                    electromagnetic spectrum in one view.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon">🔭</div>
                  <h2 className="feature-card-title">Infinite Zoom</h2>
                  <p className="feature-card-desc">
                    Logarithmic pan and zoom lets you drill from the full spectrum
                    down to a single WiFi channel width.
                  </p>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon">📱</div>
                  <h2 className="feature-card-title">Real Applications</h2>
                  <p className="feature-card-desc">
                    30+ real-world technologies overlaid — WiFi, GPS, 5G, fiber
                    optics, medical imaging, and more.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
