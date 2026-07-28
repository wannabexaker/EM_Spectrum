'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { F_MIN, freqToScreenX, formatFrequency, LOG_MIN, LOG_MAX } from '@/lib/zoom/logMapper'
import { SPECTRUM_LANES } from '@/lib/spectrumLanes'

// Ruler sits over the canvas. Width/height come from CSS (100% of parent).
// We compute tick positions as percentages so it's layout-independent.

function freqToPct(freq: number, center: number, zoom: number): number {
  return freqToScreenX(freq, 100, center, zoom)
}

interface Tick {
  pct: number
  label: string
  isMajor: boolean
}

/**
 * @param maxLabels How many decade labels the ruler has room for. At zoom 1 there are 40
 *   decades in view; printing all of them left ~9px per label on a phone and ~38px on a
 *   laptop, so the axis read as a smear at every size. Ticks still draw at every decade —
 *   only the text thins out.
 */
function buildTicks(center: number, zoom: number, maxLabels: number): Tick[] {
  const ticks: Tick[] = []
  const logSpan = (LOG_MAX - LOG_MIN) / zoom
  const logCenter = Math.log10(Math.max(center, F_MIN))
  const logLeft  = logCenter - logSpan / 2
  const logRight = logCenter + logSpan / 2

  // Major ticks: every decade (log integer)
  const firstDecade = Math.ceil(logLeft)
  const lastDecade  = Math.floor(logRight)
  const decades = Math.max(1, lastDecade - firstDecade + 1)
  const stride = Math.max(1, Math.ceil(decades / Math.max(2, maxLabels)))
  for (let logF = firstDecade; logF <= lastDecade; logF++) {
    const freq = Math.pow(10, logF)
    const pct  = freqToPct(freq, center, zoom)
    if (pct < -2 || pct > 102) continue
    // Anchor the kept labels to the decade value itself, so they don't shuffle while panning.
    const labelled = ((logF % stride) + stride) % stride === 0
    ticks.push({ pct, label: labelled ? formatFrequency(freq) : '', isMajor: true })
  }

  // Minor ticks: 2× and 5× multiples within each decade (only when zoomed in enough)
  if (zoom >= 3) {
    for (let logF = Math.floor(logLeft); logF <= lastDecade; logF++) {
      for (const mult of [2, 5]) {
        const freq = Math.pow(10, logF) * mult
        if (Math.log10(freq) < logLeft || Math.log10(freq) > logRight) continue
        const pct = freqToPct(freq, center, zoom)
        if (pct < -2 || pct > 102) continue
        ticks.push({ pct, label: zoom >= 8 ? formatFrequency(freq) : '', isMajor: false })
      }
    }
  }

  return ticks
}

export function SpectrumRuler() {
  const center = useSpectrumStore(s => s.centerFrequency)
  const zoom   = useSpectrumStore(s => s.zoomLevel)

  // Roughly 88px per label is what it takes for "100.00 MHz" not to touch its neighbour.
  const [maxLabels, setMaxLabels] = useState(12)
  useEffect(() => {
    const measure = () => setMaxLabels(Math.max(4, Math.floor(window.innerWidth / 88)))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const ticks = useMemo(() => buildTicks(center, zoom, maxLabels), [center, zoom, maxLabels])

  return (
    <div className="ruler-overlay" aria-hidden="true">
      {/* Horizontal ruler — frequency axis */}
      <div className="ruler-h">
        {ticks.map((t, i) => (
          <div
            key={i}
            className={`ruler-tick ${t.isMajor ? 'major' : 'minor'}`}
            style={{ left: `${t.pct}%` }}
          >
            {t.label && <span className="tick-label">{t.label}</span>}
          </div>
        ))}
      </div>

      {/* Vertical ruler — track category labels (fixed Y positions) */}
      <div className="ruler-v">
        {SPECTRUM_LANES.map(lane => (
          <div
            key={lane.id}
            className="ruler-v-track"
            style={{ top: `${lane.y * 100}%`, '--lane-color': lane.color } as CSSProperties}
          >
            <span>{lane.id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
