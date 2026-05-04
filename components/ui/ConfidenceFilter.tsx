'use client'

import { useState } from 'react'
import type { ScientificConfidence } from '@/types/spectrum'

export type ConfidenceLevel = ScientificConfidence | 'all'

interface ConfidenceFilterProps {
  selectedLevels: ConfidenceLevel[]
  onLevelsChange: (levels: ConfidenceLevel[]) => void
  showLabel?: boolean
}

const CONFIDENCE_LEVELS: Array<{ id: ScientificConfidence; label: string; description: string; color: string }> = [
  {
    id: 'Scientifically Verified',
    label: 'Scientifically Verified',
    description: 'Established via peer-reviewed science, standards, or repeated measurement',
    color: '#2ecc71',
  },
  {
    id: 'Strong Evidence',
    label: 'Strong Evidence',
    description: 'High-quality peer-reviewed studies or robust field measurements',
    color: '#f39c12',
  },
  {
    id: 'Estimated / Approximate',
    label: 'Estimated',
    description: 'Derived from measured parameters; interpretation or extrapolation involved',
    color: '#e67e22',
  },
  {
    id: 'Theoretical',
    label: 'Theoretical',
    description: 'Based on computational models or first-principles calculation',
    color: '#9b59b6',
  },
  {
    id: 'Anecdotal',
    label: 'Anecdotal',
    description: 'Personal reports or single observations; reproducibility unclear',
    color: '#95a5a6',
  },
  {
    id: 'Folklore / Cultural Claim',
    label: 'Folklore / Cultural',
    description: 'Traditional beliefs or cultural claims; scientific validation pending',
    color: '#8e44ad',
  },
  {
    id: 'Pseudoscience / Unsupported',
    label: 'Unsupported',
    description: 'Claimed but not scientifically supported; kept for historical/cultural context',
    color: '#e74c3c',
  },
  {
    id: 'Unknown / Needs Validation',
    label: 'Unknown',
    description: 'Insufficient data or unclear confidence; requires further research',
    color: '#34495e',
  },
]

export function ConfidenceFilter({ selectedLevels, onLevelsChange, showLabel = true }: ConfidenceFilterProps) {
  const [expanded, setExpanded] = useState(false)

  const toggleLevel = (level: ScientificConfidence) => {
    const newLevels = selectedLevels.includes(level)
      ? selectedLevels.filter(l => l !== level)
      : [...selectedLevels.filter(l => l !== 'all'), level]

    onLevelsChange(newLevels.length === 0 ? ['all'] : newLevels)
  }

  const toggleAll = (include: boolean) => {
    if (include) {
      onLevelsChange(['all'])
    } else {
      onLevelsChange(CONFIDENCE_LEVELS.map(l => l.id))
    }
  }

  const allSelected = selectedLevels.includes('all')

  return (
    <div className="confidence-filter-container">
      {showLabel && <label className="confidence-filter-label">Filter by Confidence:</label>}

      <button
        className="confidence-filter-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label="Toggle confidence filter"
      >
        <span className="confidence-filter-summary">
          {allSelected ? 'All Confidence Levels' : `${selectedLevels.length} Level${selectedLevels.length === 1 ? '' : 's'}`}
        </span>
        <span className="confidence-filter-icon">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="confidence-filter-menu">
          <div className="confidence-filter-option">
            <label>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => toggleAll(e.target.checked)}
                aria-label="Select all confidence levels"
              />
              <span className="confidence-filter-text">All Levels</span>
            </label>
          </div>

          {CONFIDENCE_LEVELS.map(level => (
            <div key={level.id} className="confidence-filter-option">
              <label title={level.description}>
                <input
                  type="checkbox"
                  checked={!allSelected && selectedLevels.includes(level.id)}
                  onChange={() => toggleLevel(level.id)}
                  disabled={allSelected}
                  aria-label={`Select ${level.label}`}
                />
                <span className="confidence-filter-color-dot" style={{ backgroundColor: level.color }} />
                <span className="confidence-filter-text">{level.label}</span>
              </label>
              <span className="confidence-filter-tooltip">{level.description}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .confidence-filter-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(30, 30, 30, 0.8);
          border-radius: 8px;
          border: 1px solid rgba(100, 200, 255, 0.3);
        }

        .confidence-filter-label {
          font-size: 0.85rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .confidence-filter-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(50, 50, 50, 0.8);
          border: 1px solid rgba(100, 200, 255, 0.2);
          border-radius: 6px;
          padding: 0.6rem 0.8rem;
          color: #00d4ff;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .confidence-filter-toggle:hover {
          background: rgba(60, 60, 60, 0.9);
          border-color: rgba(100, 200, 255, 0.5);
        }

        .confidence-filter-summary {
          flex: 1;
        }

        .confidence-filter-icon {
          margin-left: 0.5rem;
          font-size: 0.75rem;
          transition: transform 0.2s ease;
        }

        .confidence-filter-menu {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0.5rem;
          background: rgba(20, 20, 20, 0.9);
          border: 1px solid rgba(100, 200, 255, 0.1);
          border-radius: 6px;
          max-height: 400px;
          overflow-y: auto;
        }

        .confidence-filter-option {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .confidence-filter-option label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s ease;
          color: #ccc;
          font-size: 0.9rem;
        }

        .confidence-filter-option label:hover {
          background: rgba(100, 200, 255, 0.1);
        }

        .confidence-filter-option input[type='checkbox'] {
          cursor: pointer;
          accent-color: #00d4ff;
        }

        .confidence-filter-option input[type='checkbox']:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .confidence-filter-color-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .confidence-filter-text {
          flex: 1;
        }

        .confidence-filter-tooltip {
          display: none;
          font-size: 0.75rem;
          color: #888;
          margin-left: 2rem;
          padding: 0.25rem 0.5rem;
          border-left: 2px solid rgba(100, 200, 255, 0.2);
        }

        .confidence-filter-option label:hover + .confidence-filter-tooltip {
          display: block;
        }
      `}</style>
    </div>
  )
}
