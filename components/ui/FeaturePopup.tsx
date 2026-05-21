'use client'

import { useEffect, useRef } from 'react'
import { ATLAS_CATEGORY_LABELS } from '@/data/universalVibrationsAtlas'
import { F_MIN, formatFrequency } from '@/lib/zoom/logMapper'
import { findRelatedFeatures, formatRelationshipReason } from '@/lib/spectrum/featureRelationships'
import { useSpectrumStore } from '@/store/spectrumStore'
import type { FrequencyFeature, FrequencyRegulatoryNote, RegulatoryRegion } from '@/types/spectrum'

interface Props {
  feature: FrequencyFeature
  x: number
  y: number
  canvasW: number
  canvasH: number
  onClose: () => void
  onNavigate?: (feature: FrequencyFeature) => void
}

const REGION_LABELS: Record<RegulatoryRegion, string> = {
  all: 'All',
  eu: 'EU',
  us: 'US',
  japan: 'Japan',
}

function noteMatchesRegion(note: FrequencyRegulatoryNote, region: RegulatoryRegion): boolean {
  if (region === 'all') return true

  const value = note.region.toLowerCase()
  if (region === 'eu') return value.includes('eu') || value.includes('cept') || value.includes('etsi')
  if (region === 'us') return value.includes('us') || value.includes('fcc')
  return value.includes('japan')
}

export function FeaturePopup({ feature, x, y, canvasW, canvasH, onClose, onNavigate }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const regulatoryRegion = useSpectrumStore(s => s.regulatoryRegion)
  const favoriteFeatureIds = useSpectrumStore(s => s.favoriteFeatureIds)
  const toggleFavoriteFeature = useSpectrumStore(s => s.toggleFavoriteFeature)
  const isFavorite = favoriteFeatureIds.includes(feature.id)

  useEffect(() => {
    let frame: number
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    // Delay attaching so the opening click/tap doesn't immediately close
    frame = requestAnimationFrame(() => {
      window.addEventListener('pointerdown', handler)
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', handler)
    }
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
  const popupW = Math.min(POPUP_W, canvasW - 16)
  const left = Math.max(8, Math.min(x + 12, canvasW - popupW - 8))
  const top = y + 24 + POPUP_H > canvasH ? Math.max(8, y - POPUP_H - 12) : y + 24

  const fMin = Math.max(F_MIN, feature.frequency_center - feature.frequency_bandwidth / 2)
  const fMax = feature.frequency_center + feature.frequency_bandwidth / 2
  const periodSeconds = feature.periodSeconds ?? (feature.frequency_center > 0 ? 1 / feature.frequency_center : undefined)
  const atlasLabel = feature.atlasCategory ? ATLAS_CATEGORY_LABELS[feature.atlasCategory] : null
  const related = findRelatedFeatures(feature, 6)
  const regulatoryNotes = feature.regulatory ?? []
  const visibleRegulatoryNotes = regulatoryNotes.filter(note => noteMatchesRegion(note, regulatoryRegion))

  return (
    <div
      ref={ref}
      className="feature-popup"
      style={{ left, top }}
      role="dialog"
      aria-label={feature.label}
    >
      <button
        className={`feature-popup-favorite ${isFavorite ? 'active' : ''}`}
        onClick={() => toggleFavoriteFeature(feature.id)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
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

      {feature.modulationTypes && feature.modulationTypes.length > 0 && (
        <div className="feature-popup-modulation">
          {feature.modulationTypes.map(mod => (
            <span key={mod} className="feature-mod-tag">{mod}</span>
          ))}
        </div>
      )}

      <p className="feature-popup-detail">{feature.detail}</p>

      {regulatoryNotes.length > 0 && (
        <div className="feature-popup-regulatory">
          <span className="feature-popup-regulatory-label">
            Legal limits · {REGION_LABELS[regulatoryRegion]}
          </span>
          {visibleRegulatoryNotes.length > 0 ? (
            visibleRegulatoryNotes.slice(0, 4).map(note => (
              <div key={`${note.region}-${note.range ?? note.limit}`} className="feature-reg-note">
                <strong>{note.region}</strong>
                {note.range && <span>{note.range}</span>}
                <em>{note.limit}</em>
                {note.conditions && <small>{note.conditions}</small>}
                {note.source?.url ? (
                  <a href={note.source.url} target="_blank" rel="noreferrer">
                    {note.source.label}
                  </a>
                ) : note.source?.label ? (
                  <small>{note.source.label}</small>
                ) : null}
              </div>
            ))
          ) : (
            <div className="feature-reg-empty">
              No {REGION_LABELS[regulatoryRegion]} legal note available for this card yet.
            </div>
          )}
        </div>
      )}

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

      {onNavigate && related.length > 0 && (
        <div className="feature-popup-related">
          <span className="feature-popup-related-label">Related</span>
          <div className="feature-popup-chips">
            {related.map(rel => (
              <button
                key={rel.feature.id}
                className={`feature-chip ${rel.curated ? 'is-curated' : ''}`}
                onClick={() => onNavigate(rel.feature)}
                title={`${formatRelationshipReason(rel.reason)}${rel.note ? ` · ${rel.note}` : ''}`}
              >
                {rel.curated && <span className="feature-chip-mark" aria-hidden>●</span>}
                {rel.feature.shortLabel}
                <span className="feature-chip-freq">{formatFrequency(rel.feature.frequency_center)}</span>
              </button>
            ))}
          </div>
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
