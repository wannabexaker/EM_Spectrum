'use client'

import Link from 'next/link'
import { useState } from 'react'
import ShaderBackground from '@/components/ui/shader-background'

export default function LandingPage() {
  const [currentFloor, setCurrentFloor] = useState<1 | 2>(1)

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
              From 1 Hz to 10²⁶ Hz — explore every frequency in the universe.
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

        {/* Floor 2: Controls & Features */}
        {currentFloor === 2 && (
          <section className="landing-floor landing-floor-2" aria-label="Quick controls and highlights">
            <button
              className="floor-toggle-btn floor-toggle-up"
              onClick={() => setCurrentFloor(1)}
              aria-label="Return to introduction"
              title="Back to introduction"
            >
              ↑
            </button>

            <div className="floor-2-content">
              <div className="controls-guide" aria-label="Spectrum controls quick reference">
                <h2 className="controls-guide-title">Controls Quick Guide</h2>
                <div className="controls-guide-grid">
                  <div className="controls-guide-item">
                    <strong>Arrows</strong>
                    <span>Left/Right move in the same lane. Up/Down switch lane.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Shift + Arrows</strong>
                    <span>Precision POI navigation across nearby points.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Scroll / Pinch</strong>
                    <span>Zoom in and out on a logarithmic scale.</span>
                  </div>
                  <div className="controls-guide-item">
                    <strong>Drag</strong>
                    <span>Pan across frequency decades.</span>
                  </div>
                </div>
              </div>

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
