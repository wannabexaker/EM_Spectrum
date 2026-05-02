'use client'

import { useEffect, useRef } from 'react'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import { F_MIN, formatFrequency } from '@/lib/zoom/logMapper'
import type { FrequencyFeature } from '@/types/spectrum'

interface Props {
  feature: FrequencyFeature
  x: number
  y: number
  canvasW: number
  canvasH: number
  onClose: () => void
}

export function FeaturePopup({ feature, x, y, canvasW, canvasH, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const POPUP_W = 300
  const POPUP_H = 260
  const left = Math.max(8, Math.min(x + 12, canvasW - POPUP_W - 8))
  const top = y + 24 + POPUP_H > canvasH ? Math.max(8, y - POPUP_H - 12) : y + 24

  const fMin = Math.max(F_MIN, feature.frequency_center - feature.frequency_bandwidth / 2)
  const fMax = feature.frequency_center + feature.frequency_bandwidth / 2
  const periodSeconds = feature.periodSeconds ?? (feature.frequency_center > 0 ? 1 / feature.frequency_center : undefined)
  const atlasLabel = feature.atlasCategory ? ATLAS_CATEGORY_LABELS[feature.atlasCategory] : null

  return (
    <div
      ref={ref}
      className="feature-popup"
      style={{ left, top }}
      role="dialog"
      aria-label={feature.label}
    >
      <button className="feature-popup-close" onClick={onClose} aria-label="Close">x</button>

      <div className="feature-popup-dot" style={{ background: feature.color }} />
      <div className="feature-popup-family">{feature.family}</div>
      <div className="feature-popup-label">{feature.label}</div>

      {(atlasLabel || feature.confidence) && (
        <div className="feature-popup-meta">
          {atlasLabel && <span>{atlasLabel}</span>}
          {feature.confidence && <span>{feature.confidence}</span>}
        </div>
      )}

      <div className="feature-popup-freq">
        {feature.frequency_bandwidth > 0
          ? `${formatFrequency(fMin)} - ${formatFrequency(fMax)}`
          : formatFrequency(feature.frequency_center)}
      </div>

      {periodSeconds && Number.isFinite(periodSeconds) && (
        <div className="feature-popup-period">
          period {formatPeriod(periodSeconds)}
        </div>
      )}

      <p className="feature-popup-detail">{feature.detail}</p>

      {feature.sources && feature.sources.length > 0 && (
        <div className="feature-popup-sources">
          <span>Sources</span>
          {feature.sources.slice(0, 3).map(source => (
            source.url ? (
              <a key={`${source.label}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ) : (
              <em key={source.label}>{source.label}</em>
            )
          ))}
        </div>
      )}
    </div>
  )
}

function formatPeriod(seconds: number): string {
  if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)} us`
  if (seconds < 1) return `${(seconds * 1e3).toFixed(2)} ms`
  if (seconds < 60) return `${seconds.toFixed(2)} s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)} h`
  if (seconds < 365.2425 * 86400) return `${(seconds / 86400).toFixed(2)} d`
  return `${(seconds / (365.2425 * 86400)).toFixed(2)} y`
}
