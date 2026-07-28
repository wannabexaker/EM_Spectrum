'use client'

import { useEffect, useRef } from 'react'
import { F_MIN, formatFrequency } from '@/lib/zoom/logMapper'
import { CopyCardLink } from '@/components/ui/CopyCardLink'
import type { ProfessionalBand, ProfessionalTechnology } from '@/data/professionalSpectrum'

/** What the canvas hit-test resolved: an ITU sub-band bracket or a technology overlay. */
export type ProTarget =
  | { kind: 'band'; band: ProfessionalBand }
  | { kind: 'tech'; tech: ProfessionalTechnology }

interface Props {
  target: ProTarget
  x: number
  y: number
  canvasW: number
  canvasH: number
  onClose: () => void
  onZoom: (frequency: number) => void
}

/**
 * Detail panel for professional-mode markers. These used to be decorative — drawn on the
 * canvas but unclickable, with no way to read what a diamond or bracket actually meant.
 * Reuses the .feature-popup styling so professional content reads identically to RF cards.
 */
export function ProInfoPopup({ target, x, y, canvasW, canvasH, onClose, onZoom }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame: number
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    // Delay attaching so the opening click doesn't immediately close the panel.
    frame = requestAnimationFrame(() => window.addEventListener('pointerdown', handler))
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', handler)
    }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isBand = target.kind === 'band'
  const source = isBand ? target.band : target.tech
  const label = source.label
  const color = source.color

  const centerFrequency = isBand
    ? Math.sqrt(target.band.frequencyMin * target.band.frequencyMax)
    : target.tech.frequency

  let rangeText: string
  if (isBand) {
    rangeText = `${formatFrequency(target.band.frequencyMin)} - ${formatFrequency(target.band.frequencyMax)}`
  } else if (target.tech.bandwidth && target.tech.bandwidth > 0) {
    const half = target.tech.bandwidth / 2
    rangeText = `${formatFrequency(Math.max(F_MIN, target.tech.frequency - half))} - ${formatFrequency(target.tech.frequency + half)}`
  } else {
    rangeText = formatFrequency(target.tech.frequency)
  }

  const POPUP_W = 300
  const POPUP_H = 230
  const popupW = Math.min(POPUP_W, canvasW - 16)
  const left = Math.max(8, Math.min(x + 12, canvasW - popupW - 8))
  const top = y + 24 + POPUP_H > canvasH ? Math.max(8, y - POPUP_H - 12) : y + 24

  return (
    <div
      ref={ref}
      className="feature-popup"
      style={{ left, top }}
      role="dialog"
      aria-label={label}
    >
      <button className="feature-popup-close" onClick={onClose} aria-label="Close">x</button>

      <div className="feature-popup-dot" style={{ background: color }} />
      <div className="feature-popup-family">
        {isBand ? 'ITU sub-band' : 'Technology allocation'} · {source.category}
      </div>
      <div className="feature-popup-label">{label}</div>

      {source.confidence && (
        <div className="feature-popup-meta">
          <span>{source.confidence}</span>
        </div>
      )}

      <div className="feature-popup-freq">{rangeText}</div>

      {!isBand && target.tech.bandwidth && target.tech.bandwidth > 0 && (
        <div className="feature-popup-period">
          center {formatFrequency(target.tech.frequency)} · bandwidth {formatFrequency(target.tech.bandwidth)}
        </div>
      )}

      <p className="feature-popup-detail">{isBand ? target.band.uses : target.tech.detail}</p>

      {!isBand && target.tech.regionScope && (
        <div className="pro-popup-scope">
          <span className="edu-popup-related-label">Where this applies</span>
          <p>{target.tech.regionScope}</p>
        </div>
      )}

      {source.standard && (
        <div className="feature-popup-modulation">
          <span className="feature-mod-tag">{source.standard}</span>
        </div>
      )}

      {source.sources && source.sources.length > 0 && (
        <div className="feature-popup-sources">
          <span>Sources</span>
          {source.sources.slice(0, 3).map(item =>
            item.url ? (
              <a key={`${item.label}-${item.url}`} href={item.url} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ) : (
              <em key={item.label}>{item.label}</em>
            )
          )}
        </div>
      )}

      <button className="feature-popup-zoom" onClick={() => onZoom(centerFrequency)}>
        Zoom to {isBand ? 'band' : 'allocation'}
      </button>
      <CopyCardLink kind="pro" id={source.id} />
    </div>
  )
}
