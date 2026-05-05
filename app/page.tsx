import Link from 'next/link'
import ShaderBackground from '@/components/ui/shader-background'

export default function LandingPage() {
  return (
    <div className="landing-page" style={{ background: 'transparent' }}>
      <ShaderBackground />
      <div className="starfield" aria-hidden />
      <div className="scanlines" aria-hidden />

      <main className="landing-content">
        <p className="landing-eyebrow">Interactive Science Visualization</p>

        <h1 className="landing-title">The Electromagnetic Spectrum</h1>

        <p className="landing-subtitle">
          From 1 Hz to 10²⁶ Hz — explore every frequency in the universe.
          Infinite zoom. Real-world applications.
          <br />
          Full physics detail.
        </p>

        <div className="spectrum-preview" aria-label="Spectrum preview" role="img" />

        <Link href="/spectrum/" className="cta-button">
          Explore the Spectrum →
        </Link>

        <details className="controls-guide" aria-label="Spectrum controls quick reference">
          <summary className="controls-guide-trigger">Controls quick guide</summary>
          <div className="controls-guide-panel">
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
        </details>

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
      </main>
    </div>
  )
}
