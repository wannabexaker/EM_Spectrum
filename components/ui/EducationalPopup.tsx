'use client'

import { useEffect, useRef } from 'react'
import { formatFrequency } from '@/lib/zoom/logMapper'
import type { EducationalExample } from '@/data/educationalExamples'
import { EDUCATIONAL_EXAMPLE_MAP } from '@/data/educationalExamples'

interface Props {
  example: EducationalExample
  x: number
  y: number
  canvasW: number
  canvasH: number
  onClose: () => void
  onNavigate: (example: EducationalExample) => void
}

export function EducationalPopup({ example, x, y, canvasW, canvasH, onClose, onNavigate }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame: number
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    frame = requestAnimationFrame(() => {
      window.addEventListener('pointerdown', handler)
    })
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

  const POPUP_W = 320
  const POPUP_H = 260
  const popupW = Math.min(POPUP_W, canvasW - 16)
  const left = Math.max(8, Math.min(x + 14, canvasW - popupW - 8))
  const top  = y + 24 + POPUP_H > canvasH ? Math.max(8, y - POPUP_H - 14) : y + 24

  const related = example.relatedIds
    .map(id => EDUCATIONAL_EXAMPLE_MAP.get(id))
    .filter(Boolean) as EducationalExample[]

  const dotColor = `#${example.color.toString(16).padStart(6, '0')}`

  return (
    <div
      ref={ref}
      className="edu-popup"
      style={{ left, top }}
      role="dialog"
      aria-label={example.label}
    >
      <button className="edu-popup-close" onClick={onClose} aria-label="Close">×</button>

      <div className="edu-popup-header">
        <span className="edu-popup-dot" style={{ background: dotColor }} />
        <div>
          <div className="edu-popup-label">{example.label}</div>
          <div className="edu-popup-meta">
            {formatFrequency(example.frequency)}
            {' · '}
            <span className="edu-popup-discovery">
              {example.discoveredBy}, {example.discoveredYear}
            </span>
          </div>
        </div>
      </div>

      <p className="edu-popup-story">{example.story}</p>

      {related.length > 0 && (
        <div className="edu-popup-related">
          <span className="edu-popup-related-label">Related</span>
          <div className="edu-popup-chips">
            {related.map(rel => (
              <button
                key={rel.id}
                className="edu-chip"
                style={{ '--chip-color': `#${rel.color.toString(16).padStart(6, '0')}` } as React.CSSProperties}
                onClick={() => onNavigate(rel)}
              >
                {rel.shortLabel}
                <span className="edu-chip-freq">{formatFrequency(rel.frequency)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
