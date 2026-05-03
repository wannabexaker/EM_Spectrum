'use client'

import { useCallback, useEffect, useRef, useState, useMemo, type CSSProperties } from 'react'
import { encodeViewportState } from '@/lib/deeplink/urlState'
import { F_MIN, LOG_RANGE } from '@/lib/zoom/logMapper'
import { SPECTRUM_LANES, type SpectrumLane } from '@/lib/spectrumLanes'
import { useSpectrumStore } from '@/store/spectrumStore'
import { frequencyFeatures } from '@/data/frequencyFeatures'
import { EDUCATIONAL_EXAMPLES } from '@/data/educationalExamples'

const MAX_NAV_ZOOM = 5000
const MIN_NAV_ZOOM = 0.5

function getLaneTarget(lane: SpectrumLane): { center: number; zoom: number } {
  const minLog = Math.log10(Math.max(lane.frequencyMin, F_MIN))
  const maxLog = Math.log10(Math.max(lane.frequencyMax, F_MIN))
  const span = Math.max(maxLog - minLog, 0.08)
  const center = Math.pow(10, (minLog + maxLog) / 2)
  const zoom = Math.min(MAX_NAV_ZOOM, Math.max(MIN_NAV_ZOOM, LOG_RANGE / (span * 1.22)))
  return { center, zoom }
}

function getItemTarget(frequency: number): { center: number; zoom: number } {
  return { center: frequency, zoom: 24 }
}

interface SubEntry {
  id: string
  label: string
  frequency: number
  family?: string
  color?: string
}

interface SubGroup {
  family: string
  items: SubEntry[]
  color: string
}

function buildSubGroups(lane: SpectrumLane): SubGroup[] {
  const groups = new Map<string, SubGroup>()

  // Collect frequencyFeatures for this lane
  for (const f of frequencyFeatures) {
    const cat = f.category === 'technology' ? null : f.category
    if (cat !== lane.id && f.category !== lane.id) {
      // For 'technology' features, check if the center freq is in this lane's range
      if (f.category !== 'technology') continue
      if (f.frequency_center < lane.frequencyMin || f.frequency_center > lane.frequencyMax) continue
    }
    const family = f.family || 'Other'
    if (!groups.has(family)) groups.set(family, { family, items: [], color: f.color })
    const g = groups.get(family)!
    if (g.items.length < 20) {
      g.items.push({ id: f.id, label: f.shortLabel || f.label, frequency: f.frequency_center, family: f.family, color: f.color })
    }
  }

  // Collect educational examples for this lane
  const eduItems: SubEntry[] = []
  for (const ex of EDUCATIONAL_EXAMPLES) {
    if (ex.category !== lane.id) continue
    eduItems.push({ id: ex.id, label: ex.label, frequency: ex.frequency, color: ex.color.toString(16).padStart(6, '0').replace(/^/, '#') })
  }
  if (eduItems.length > 0) {
    groups.set('_edu', { family: 'Educational Examples', items: eduItems.slice(0, 20), color: '#fff9c4' })
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.family === '_edu') return 1
    if (b.family === '_edu') return -1
    return a.items[0]?.frequency - b.items[0]?.frequency
  })
}

interface ContextMenuState {
  lane: SpectrumLane
  x: number
  y: number
  expandedGroup: string | null
}

export function SpectrumCategoryLegend() {
  const setZoom = useSpectrumStore(s => s.setZoom)
  const selectBand = useSpectrumStore(s => s.selectBand)
  const setFocusedLane = useSpectrumStore(s => s.setFocusedLane)
  const setSelectedLane = useSpectrumStore(s => s.setSelectedLane)
  const focusedLaneId = useSpectrumStore(s => s.focusedLaneId)
  const selectedLaneId = useSpectrumStore(s => s.selectedLaneId)
  const animationRef = useRef<number | null>(null)
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const navigateToLane = useCallback((lane: SpectrumLane) => {
    const target = getLaneTarget(lane)
    selectBand(null)
    setSelectedLane(lane.id)

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const start = useSpectrumStore.getState()
    const startLogCenter = Math.log10(Math.max(start.centerFrequency, F_MIN))
    const startLogZoom = Math.log10(Math.max(start.zoomLevel, MIN_NAV_ZOOM))
    const targetLogCenter = Math.log10(target.center)
    const targetLogZoom = Math.log10(target.zoom)
    const startTime = performance.now()
    const duration = 420

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const nextCenter = Math.pow(10, startLogCenter + (targetLogCenter - startLogCenter) * eased)
      const nextZoom = Math.pow(10, startLogZoom + (targetLogZoom - startLogZoom) * eased)
      setZoom(nextCenter, nextZoom)

      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick)
        return
      }

      animationRef.current = null
      encodeViewportState(target.center, target.zoom)
    }

    animationRef.current = requestAnimationFrame(tick)
  }, [selectBand, setSelectedLane, setZoom])

  const navigateTo = useCallback((frequency: number) => {
    const target = getItemTarget(frequency)
    selectBand(null)
    setCtxMenu(null)
    if (ctxMenu) setSelectedLane(ctxMenu.lane.id)

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const start = useSpectrumStore.getState()
    const startLogCenter = Math.log10(Math.max(start.centerFrequency, F_MIN))
    const startLogZoom = Math.log10(Math.max(start.zoomLevel, MIN_NAV_ZOOM))
    const targetLogCenter = Math.log10(Math.max(target.center, F_MIN))
    const targetLogZoom = Math.log10(target.zoom)
    const startTime = performance.now()
    const duration = 480

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const nextCenter = Math.pow(10, startLogCenter + (targetLogCenter - startLogCenter) * eased)
      const nextZoom = Math.pow(10, startLogZoom + (targetLogZoom - startLogZoom) * eased)
      setZoom(nextCenter, nextZoom)
      if (t < 1) { animationRef.current = requestAnimationFrame(tick); return }
      animationRef.current = null
      encodeViewportState(target.center, target.zoom)
    }

    animationRef.current = requestAnimationFrame(tick)
  }, [ctxMenu, selectBand, setSelectedLane, setZoom])

  const handleContextMenu = useCallback((e: React.MouseEvent, lane: SpectrumLane) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ lane, x: e.clientX, y: e.clientY, expandedGroup: null })
  }, [])

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!ctxMenu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxMenu(null) }
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCtxMenu(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [ctxMenu])

  useEffect(() => () => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
  }, [])

  useEffect(() => () => {
    setFocusedLane(null)
  }, [setFocusedLane])

  // Compute sub-groups for the hovered lane (memoized per lane id)
  const ctxGroups = useMemo(
    () => ctxMenu ? buildSubGroups(ctxMenu.lane) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctxMenu?.lane.id]
  )

  return (
    <>
      <div className="category-legend" aria-label="Spectrum category navigation">
        {SPECTRUM_LANES.map(lane => (
          <button
            key={lane.id}
            className={[
              'category-lane-label',
              selectedLaneId === lane.id ? 'is-active' : '',
              focusedLaneId === lane.id ? 'is-preview' : '',
            ].filter(Boolean).join(' ')}
            style={{ top: `${lane.y * 100}%`, '--lane-color': lane.color } as CSSProperties}
            type="button"
            onClick={() => navigateToLane(lane)}
            onContextMenu={(e) => handleContextMenu(e, lane)}
            onMouseEnter={() => setFocusedLane(lane.id)}
            onMouseLeave={() => setFocusedLane(null)}
            title={`Left-click: zoom to ${lane.label} · Right-click: explore frequencies`}
            aria-label={`Zoom to ${lane.label}, ${lane.range}. Right-click for subcategories.`}
          >
            <span className="category-lane-rail" />
            <span className="category-lane-copy">
              <strong>{lane.label}</strong>
              <em>{lane.range}</em>
            </span>
            <span className="category-lane-menu-hint" aria-hidden="true">⋮</span>
          </button>
        ))}
      </div>

      {/* Right-click context menu */}
      {ctxMenu && (
        <div
          ref={menuRef}
          className="legend-ctx-menu"
          style={{
            left: Math.min(ctxMenu.x, window.innerWidth - 320),
            top: Math.min(ctxMenu.y, window.innerHeight - 400),
          }}
          role="menu"
          aria-label={`${ctxMenu.lane.label} subcategories`}
        >
          <div className="legend-ctx-header" style={{ '--lc': ctxMenu.lane.color } as CSSProperties}>
            <span className="legend-ctx-title">{ctxMenu.lane.label}</span>
            <span className="legend-ctx-range">{ctxMenu.lane.range}</span>
            <button className="legend-ctx-close" onClick={() => setCtxMenu(null)} aria-label="Close">✕</button>
          </div>

          <div className="legend-ctx-body">
            {ctxGroups.length === 0 ? (
              <div className="legend-ctx-empty">No frequency points indexed</div>
            ) : ctxGroups.map(group => (
              <div key={group.family} className="legend-ctx-group">
                <button
                  className="legend-ctx-group-header"
                  style={{ '--gc': group.color } as CSSProperties}
                  onClick={() => setCtxMenu(prev => prev
                    ? { ...prev, expandedGroup: prev.expandedGroup === group.family ? null : group.family }
                    : null
                  )}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setCtxMenu(prev => prev
                      ? { ...prev, expandedGroup: prev.expandedGroup === group.family ? null : group.family }
                      : null
                    )
                  }}
                  aria-expanded={ctxMenu.expandedGroup === group.family}
                  role="menuitem"
                >
                  <span className="legend-ctx-group-dot" style={{ background: group.color }} />
                  <span className="legend-ctx-group-name">{group.family}</span>
                  <span className="legend-ctx-group-count">{group.items.length}</span>
                  <span className="legend-ctx-group-arrow">
                    {ctxMenu.expandedGroup === group.family ? '▾' : '▸'}
                  </span>
                </button>

                {ctxMenu.expandedGroup === group.family && (
                  <ul className="legend-ctx-items" role="menu">
                    {group.items.map(item => (
                      <li key={item.id} role="none">
                        <button
                          className="legend-ctx-item"
                          style={{ '--ic': item.color ?? group.color } as CSSProperties}
                          onClick={() => navigateTo(item.frequency)}
                          role="menuitem"
                          title={`Navigate to ${item.label}`}
                        >
                          <span className="legend-ctx-item-dot" style={{ background: item.color ?? group.color }} />
                          <span className="legend-ctx-item-label">{item.label}</span>
                          <span className="legend-ctx-item-freq">{formatFreqShort(item.frequency)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function formatFreqShort(hz: number): string {
  if (hz < 1e3) return `${hz.toFixed(1)} Hz`
  if (hz < 1e6) return `${(hz / 1e3).toPrecision(3)} kHz`
  if (hz < 1e9) return `${(hz / 1e6).toPrecision(3)} MHz`
  if (hz < 1e12) return `${(hz / 1e9).toPrecision(3)} GHz`
  if (hz < 1e15) return `${(hz / 1e12).toPrecision(3)} THz`
  return `${hz.toExponential(2)} Hz`
}
