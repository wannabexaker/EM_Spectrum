'use client'

import { useEffect, useRef } from 'react'
import { formatFrequency } from '@/lib/zoom/logMapper'
import type { FrequencyFeature } from '@/types/spectrum'

interface Props {
  feature: FrequencyFeature
  x: number      // px from left of canvas
  y: number      // px from top of canvas
  canvasW: number
  canvasH: number
  onClose: () => void
}

export function FeaturePopup({ feature, x, y, canvasW, canvasH, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Nudge popup so it stays within canvas bounds
  const POPUP_W = 260
  const POPUP_H = 160
  const left = Math.min(x + 12, canvasW - POPUP_W - 8)
  const top  = y + 24 + POPUP_H > canvasH ? y - POPUP_H - 12 : y + 24

  const fMin = feature.frequency_center - feature.frequency_bandwidth / 2
  const fMax = feature.frequency_center + feature.frequency_bandwidth / 2

  return (
    <div
      ref={ref}
      className="feature-popup"
      style={{ left, top }}
      role="dialog"
      aria-label={feature.label}
    >
      <button className="feature-popup-close" onClick={onClose} aria-label="Close">×</button>

      <div className="feature-popup-dot" style={{ background: feature.color }} />
      <div className="feature-popup-family">{feature.family}</div>
      <div className="feature-popup-label">{feature.label}</div>

      <div className="feature-popup-freq">
        {feature.frequency_bandwidth > 0
          ? `${formatFrequency(fMin)} – ${formatFrequency(fMax)}`
          : formatFrequency(feature.frequency_center)}
      </div>

      <p className="feature-popup-detail">{feature.detail}</p>
    </div>
  )
}
