'use client'

import type { FrequencyFeature } from '@/types/spectrum'

interface SourceAttributionProps {
  sources?: FrequencyFeature['sources']
  compact?: boolean
}

export function SourceAttribution({ sources, compact = false }: SourceAttributionProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className="source-attribution source-attribution-none">
        <span className="source-note">No sources provided</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="source-attribution source-attribution-compact">
        {sources.length === 1 ? (
          <span className="source-compact-text">{sources[0].label}</span>
        ) : (
          <span className="source-compact-text">{sources.length} sources</span>
        )}
      </div>
    )
  }

  return (
    <div className="source-attribution">
      <div className="source-header">
        <strong>Sources:</strong>
      </div>
      <ul className="source-list">
        {sources.map((source, idx) => (
          <li key={idx} className="source-item">
            <span className="source-label">{source.label}</span>
            {source.url && (
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="source-link" title="Open source">
                ↗
              </a>
            )}
            {source.note && <div className="source-note">{source.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SourceAttributionInline({ sources }: SourceAttributionProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="source-attribution-inline">
      <span className="source-count">
        {sources.length} source{sources.length !== 1 ? 's' : ''}
      </span>
      {sources[0].url && (
        <a href={sources[0].url} target="_blank" rel="noopener noreferrer" className="source-link-inline" title={sources[0].label}>
          Primary ↗
        </a>
      )}
    </div>
  )
}

const styles = `
.source-attribution {
  padding: 0.75rem;
  background: rgba(30, 30, 30, 0.6);
  border-left: 3px solid rgba(100, 200, 255, 0.4);
  border-radius: 4px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #aaa;
}

.source-attribution-none {
  font-style: italic;
  opacity: 0.6;
}

.source-attribution-compact {
  display: inline-block;
  font-size: 0.8rem;
  color: #888;
}

.source-compact-text {
  padding: 0.2rem 0.4rem;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 3px;
}

.source-header {
  margin-bottom: 0.5rem;
  color: #00d4ff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.source-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.source-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.source-label {
  flex: 1;
  color: #bbb;
  word-break: break-word;
}

.source-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: rgba(100, 200, 255, 0.2);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 3px;
  color: #00d4ff;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.source-link:hover {
  background: rgba(100, 200, 255, 0.4);
  border-color: rgba(100, 200, 255, 0.6);
}

.source-note {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #999;
  font-style: italic;
}

.source-attribution-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #888;
}

.source-count {
  padding: 0.15rem 0.4rem;
  background: rgba(100, 200, 255, 0.08);
  border-radius: 3px;
  color: #999;
}

.source-link-inline {
  color: #00d4ff;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: bold;
  transition: opacity 0.2s ease;
}

.source-link-inline:hover {
  opacity: 0.8;
}
`

export function SourceAttributionStyles() {
  return <style jsx>{styles}</style>
}
