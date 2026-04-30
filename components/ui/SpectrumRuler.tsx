'use client'

import { useMemo, type CSSProperties } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { freqToScreenX, formatFrequency, LOG_MIN, LOG_MAX } from '@/lib/zoom/logMapper'
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

function buildTicks(center: number, zoom: number): Tick[] {
  const ticks: Tick[] = []
  const logSpan = (LOG_MAX - LOG_MIN) / zoom
  const logCenter = Math.log10(Math.max(center, 1))
  const logLeft  = logCenter - logSpan / 2
  const logRight = logCenter + logSpan / 2

  // Major ticks: every decade (log integer)
  const firstDecade = Math.ceil(logLeft)
  const lastDecade  = Math.floor(logRight)
  for (let logF = firstDecade; logF <= lastDecade; logF++) {
    const freq = Math.pow(10, logF)
    const pct  = freqToPct(freq, center, zoom)
    if (pct < -2 || pct > 102) continue
    ticks.push({ pct, label: formatFrequency(freq), isMajor: true })
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

  const ticks = useMemo(() => buildTicks(center, zoom), [center, zoom])

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
