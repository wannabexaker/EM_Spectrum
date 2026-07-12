'use client'

import { useEffect, useRef, useState } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { EDUCATIONAL_DOMAINS, EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'
import type { ScientificConfidence, UniversalVibrationCategory } from '@/types/spectrum'

const DOMAIN_LABEL: Record<UniversalVibrationCategory, string> = {
  physics: 'Physics',
  'human-body': 'Human body',
  animals: 'Animals',
  nature: 'Nature',
  plants: 'Plants',
  'earth-planetary': 'Earth & planetary',
  astronomy: 'Astronomy',
  technology: 'Technology',
  transport: 'Transport',
  civilization: 'Civilization',
  music: 'Music',
  'danger-safety': 'Danger & safety',
  'myths-claims': 'Myths & claims',
}

// Mirrors the badge colours in globals.css (.edu-badge[data-confidence=...]).
const CONFIDENCE_COLOR: Record<ScientificConfidence, string> = {
  'Scientifically Verified': '#34d399',
  'Strong Evidence': '#38bdf8',
  'Estimated / Approximate': '#fbbf24',
  Theoretical: '#a78bfa',
  Anecdotal: '#fb923c',
  'Folklore / Cultural Claim': '#f472b6',
  'Pseudoscience / Unsupported': '#f87171',
  'Unknown / Needs Validation': '#9ca3af',
}

// Confidence levels actually present in the dataset, ordered by the rigour scale.
const CONFIDENCE_ORDER = Object.keys(CONFIDENCE_COLOR) as ScientificConfidence[]
const PRESENT_CONFIDENCE = (() => {
  const counts = new Map<ScientificConfidence, number>()
  for (const ex of EDUCATIONAL_EXAMPLES) {
    if (ex.confidence) counts.set(ex.confidence, (counts.get(ex.confidence) ?? 0) + 1)
  }
  return CONFIDENCE_ORDER.filter(c => counts.has(c)).map(c => ({ level: c, count: counts.get(c)! }))
})()

export function EduAtlasFilter() {
  const activeMode = useSpectrumStore(s => s.activeMode)
  const hidden = useSpectrumStore(s => s.eduHiddenDomains)
  const verifiedOnly = useSpectrumStore(s => s.eduVerifiedOnly)
  const toggleDomain = useSpectrumStore(s => s.toggleEduDomain)
  const toggleVerified = useSpectrumStore(s => s.toggleEduVerifiedOnly)
  const reset = useSpectrumStore(s => s.resetEduFilters)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (activeMode !== 'educational') return null

  const activeCount = hidden.length + (verifiedOnly ? 1 : 0)

  return (
    <div className="edu-filter" ref={ref}>
      <button
        className={`edu-filter-trigger ${activeCount ? 'has-active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Filter educational pins by domain and scientific confidence"
      >
        Atlas
        {activeCount > 0 && <span className="edu-filter-count">{activeCount}</span>}
      </button>

      {open && (
        <div className="edu-filter-panel" role="group" aria-label="Educational atlas filters">
          <div className="edu-filter-row">
            <span className="edu-filter-title">Domains</span>
            {activeCount > 0 && (
              <button className="edu-filter-reset" onClick={reset}>Reset</button>
            )}
          </div>

          <div className="edu-filter-domains">
            {EDUCATIONAL_DOMAINS.map(({ domain, count }) => {
              const on = !hidden.includes(domain)
              return (
                <button
                  key={domain}
                  className={`edu-filter-chip ${on ? 'on' : 'off'}`}
                  onClick={() => toggleDomain(domain)}
                  aria-pressed={on}
                >
                  {DOMAIN_LABEL[domain] ?? domain}
                  <span className="edu-filter-chip-count">{count}</span>
                </button>
              )
            })}
          </div>

          <label className="edu-filter-verified">
            <input type="checkbox" checked={verifiedOnly} onChange={toggleVerified} />
            <span>Verified science only</span>
          </label>

          <div className="edu-filter-legend">
            <span className="edu-filter-title">Confidence</span>
            {PRESENT_CONFIDENCE.map(({ level, count }) => (
              <div className="edu-filter-legend-row" key={level}>
                <span className="edu-filter-legend-dot" style={{ background: CONFIDENCE_COLOR[level] }} />
                <span className="edu-filter-legend-label">{level}</span>
                <span className="edu-filter-legend-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
