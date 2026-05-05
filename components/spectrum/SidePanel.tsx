'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidePanel } from '@/hooks/useSidePanel'
import { useSpectrumStore } from '@/store/spectrumStore'
import {
  formatFrequency,
  formatWavelength,
  freqToWavelength,
} from '@/lib/zoom/logMapper'

type Tab = 'overview' | 'applications' | 'hazards' | 'physics'

const CATEGORY_COLORS: Record<string, string> = {
  radio:       '#00d4ff',
  microwave:   '#00ff88',
  infrared:    '#ff6b35',
  visible:     '#ffffff',
  ultraviolet: '#c77dff',
  xray:        '#4cc9f0',
  gamma:       '#ff006e',
  sound:       '#ffd60a',
}

export function SidePanel() {
  const { selectedBand, isPanelOpen, closePanel } = useSidePanel()
  const activeMode = useSpectrumStore(s => s.activeMode)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle')

  useEffect(() => {
    setActiveTab('overview')
  }, [selectedBand?.id])

  if (!selectedBand) return null

  const freqMin = formatFrequency(selectedBand.frequency_min)
  const freqMax = formatFrequency(selectedBand.frequency_max)
  const wlMin = formatWavelength(freqToWavelength(selectedBand.frequency_max))
  const wlMax = formatWavelength(freqToWavelength(selectedBand.frequency_min))
  const catColor = CATEGORY_COLORS[selectedBand.category] ?? '#ffffff'

  const copyDeepLink = async () => {
    if (typeof window === 'undefined') return
    const center = Math.sqrt(selectedBand.frequency_min * selectedBand.frequency_max)
    const url = new URL(window.location.href)
    url.searchParams.set('f', center.toExponential(3))
    url.searchParams.set('z', '8')
    const shareUrl = url.toString()

    try {
      if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({
          title: `${selectedBand.label} band`,
          text: `Explore ${selectedBand.label} on EM Spectrum`,
          url: shareUrl,
        })
        setShareState('shared')
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setShareState('copied')
      }
    } catch {
      setShareState('error')
    }

    window.setTimeout(() => setShareState('idle'), 1800)
  }

  const TABS: Tab[] = ['overview', 'applications', 'hazards', 'physics']

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.aside
          className="side-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          aria-label="Band details"
          role="complementary"
        >
          <div className="panel-header">
            <span
              className="panel-category-badge"
              style={{ borderColor: catColor, color: catColor }}
            >
              {selectedBand.category.toUpperCase()}
            </span>
            <button
              className="panel-close"
              onClick={closePanel}
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          <h2 className="panel-title">{selectedBand.label}</h2>
          <p className="panel-subtitle">{selectedBand.subcategory}</p>

          <div className="panel-ranges">
            <div className="range-item">
              <span className="range-label">Frequency</span>
              <span className="range-value">{freqMin} – {freqMax}</span>
            </div>
            <div className="range-item">
              <span className="range-label">Wavelength</span>
              <span className="range-value">{wlMin} – {wlMax}</span>
            </div>
            <div className="range-item">
              <span className="range-label">Ionization</span>
              <span
                className="range-value"
                style={{ color: selectedBand.ionization_type === 'ionizing' ? '#ff4444' : '#00ff88' }}
              >
                {selectedBand.ionization_type}
              </span>
            </div>
          </div>

          <div className="panel-tabs" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="panel-content" role="tabpanel">
            {activeTab === 'overview' && (
              <p className="panel-description">{selectedBand.description}</p>
            )}

            {activeTab === 'applications' && (
              <ul className="panel-list">
                {selectedBand.applications.map((app, i) => (
                  <li key={i} className="panel-list-item">
                    <span className="list-dot" style={{ background: catColor }} />
                    {activeMode === 'professional' ? app : app.split('(')[0].trim()}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'hazards' && (
              <div>
                {selectedBand.hazards.map((h, i) => (
                  <div key={i} className="hazard-item">
                    <span className="hazard-icon">⚠</span>
                    <p>{h}</p>
                  </div>
                ))}
                {selectedBand.hazards.length === 0 && (
                  <p className="panel-description">No significant hazards at typical exposure levels.</p>
                )}
              </div>
            )}

            {activeTab === 'physics' && (
              <div className="physics-table">
                <div className="phys-row">
                  <span>f min</span><code>{selectedBand.frequency_min.toExponential(3)} Hz</code>
                </div>
                <div className="phys-row">
                  <span>f max</span><code>{selectedBand.frequency_max.toExponential(3)} Hz</code>
                </div>
                <div className="phys-row">
                  <span>λ min</span><code>{selectedBand.wavelength_min.toExponential(3)} m</code>
                </div>
                <div className="phys-row">
                  <span>λ max</span><code>{selectedBand.wavelength_max.toExponential(3)} m</code>
                </div>
                <div className="phys-row">
                  <span>Sources</span>
                  <span>{selectedBand.sources.slice(0, 3).join(', ')}</span>
                </div>
                {activeMode === 'professional' && (
                  <div className="phys-row">
                    <span>Interactions</span>
                    <span>{selectedBand.interactions.slice(0, 2).join('; ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="panel-footer">
            <button className="panel-share-btn" onClick={copyDeepLink}>
              {shareState === 'idle' && 'Share this band'}
              {shareState === 'copied' && 'Copied!'}
              {shareState === 'shared' && 'Shared!'}
              {shareState === 'error' && 'Share failed'}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
