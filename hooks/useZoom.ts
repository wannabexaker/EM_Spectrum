'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSpectrumStore } from '@/store/spectrumStore'
import { getLODLevel } from '@/lib/zoom/lodController'
import { encodeViewportState } from '@/lib/deeplink/urlState'
import { LOG_MIN, LOG_MAX, LOG_RANGE } from '@/lib/zoom/logMapper'
import type { ZoomState } from '@/types/spectrum'
import type { RefObject } from 'react'

const MIN_ZOOM = 1    // zoom=1 shows the full spectrum exactly
const MAX_ZOOM = 50   // x50 practical limit

// Clamp zoom AND center so viewport edges never exceed [LOG_MIN, LOG_MAX]
function clampViewport(center: number, zoom: number): { center: number; zoom: number } {
  const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
  const halfSpan = (LOG_RANGE / z) / 2
  const minLogC = LOG_MIN + halfSpan
  const maxLogC = LOG_MAX - halfSpan
  const logC = Math.max(minLogC, Math.min(maxLogC, Math.log10(Math.max(center, 1))))
  return { center: Math.pow(10, logC), zoom: z }
}

export function useZoom(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const { centerFrequency, zoomLevel, setZoom } = useSpectrumStore()
  const isDragging = useRef(false)
  const isRightDragging = useRef(false)
  const lastPointerX = useRef(0)
  const lastRightY = useRef(0)
  const lastPinchDistance = useRef<number | null>(null)
  const urlDebounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const animationFrame = useRef<number | null>(null)
  const targetCenter = useRef(centerFrequency)
  const targetZoom = useRef(zoomLevel)

  const zoomState = useMemo<ZoomState>(
    () => ({ centerFrequency, zoomLevel, lodLevel: getLODLevel(zoomLevel) }),
    [centerFrequency, zoomLevel]
  )

  // ─── commitZoom ──────────────────────────────────────────────────────────
  // immediate=true  → instant (used for drag, 1:1 tracking)
  // immediate=false → eased animation (used for wheel, keyboard, presets)
  const commitZoom = useCallback((center: number, zoom: number, immediate = false) => {
    const clamped = clampViewport(center, zoom)
    targetCenter.current = clamped.center
    targetZoom.current = clamped.zoom

    if (immediate) {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
      }
      setZoom(clamped.center, clamped.zoom)
    } else if (animationFrame.current === null) {
      const tick = () => {
        const cur = useSpectrumStore.getState()
        const curLogC = Math.log10(Math.max(cur.centerFrequency, 1))
        const curLogZ = Math.log10(Math.max(cur.zoomLevel, MIN_ZOOM))
        const tgtLogC = Math.log10(Math.max(targetCenter.current, 1))
        const tgtLogZ = Math.log10(Math.max(targetZoom.current, MIN_ZOOM))

        const nextLogC = curLogC + (tgtLogC - curLogC) * 0.28
        const nextLogZ = curLogZ + (tgtLogZ - curLogZ) * 0.34

        if (Math.abs(tgtLogC - nextLogC) < 0.0008 && Math.abs(tgtLogZ - nextLogZ) < 0.0008) {
          setZoom(targetCenter.current, targetZoom.current)
          animationFrame.current = null
          return
        }

        setZoom(Math.pow(10, nextLogC), Math.pow(10, nextLogZ))
        animationFrame.current = requestAnimationFrame(tick)
      }
      animationFrame.current = requestAnimationFrame(tick)
    }

    clearTimeout(urlDebounceTimer.current)
    urlDebounceTimer.current = setTimeout(() => {
      encodeViewportState(clamped.center, clamped.zoom)
    }, 300)
  }, [setZoom])

  // ─── Wheel zoom — native listener (passive:false) ─────────────────────────
  // React's synthetic onWheel is passive in React 17+, making preventDefault()
  // a no-op. We attach natively so we can actually prevent page scroll.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const cur = useSpectrumStore.getState()
      const baseZoom   = animationFrame.current === null ? cur.zoomLevel        : targetZoom.current
      const baseCenter = animationFrame.current === null ? cur.centerFrequency  : targetCenter.current

      // ~0.0025 → ~2.2× per full notch step; smooth across all wheel devices
      const factor   = Math.exp(-e.deltaY * 0.0025)
      const newZoom  = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseZoom * factor))

      const rect = canvas.getBoundingClientRect()
      const cursorRatio  = (e.clientX - rect.left) / rect.width - 0.5
      const logSpan      = LOG_RANGE / baseZoom
      const logCenter    = Math.log10(Math.max(baseCenter, 1))
      const logCursor    = logCenter + cursorRatio * logSpan
      const newLogCenter = logCursor + (logCenter - logCursor) * (baseZoom / newZoom)

      commitZoom(Math.pow(10, newLogCenter), newZoom)   // animated (eased inertia)
    }

    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [commitZoom, canvasRef])

  // ─── Pointer events ──────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return
    e.currentTarget.setPointerCapture(e.pointerId)
    if (e.button === 2) {
      isRightDragging.current = true
      lastRightY.current = e.clientY
      return
    }
    isDragging.current = true
    lastPointerX.current = e.clientX
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Right-drag → zoom (vertical, 1:1 immediate)
    if (isRightDragging.current) {
      const dy = e.clientY - lastRightY.current
      lastRightY.current = e.clientY
      if (dy === 0) return
      const cur        = useSpectrumStore.getState()
      const baseZoom   = animationFrame.current === null ? cur.zoomLevel       : targetZoom.current
      const baseCenter = animationFrame.current === null ? cur.centerFrequency : targetCenter.current
      // dy < 0 = up = zoom in; dy > 0 = down = zoom out
      // 100 px drag ≈ 2.2× zoom (k=0.008)
      const factor  = Math.exp(-dy * 0.008)
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseZoom * factor))
      commitZoom(baseCenter, newZoom, true)   // immediate: 1:1 tracking
      return
    }
    // Left-drag → pan (horizontal, 1:1 immediate)
    if (!isDragging.current) return
    const dx = e.clientX - lastPointerX.current
    lastPointerX.current = e.clientX
    if (dx === 0) return
    const cur        = useSpectrumStore.getState()
    const baseZoom   = animationFrame.current === null ? cur.zoomLevel       : targetZoom.current
    const baseCenter = animationFrame.current === null ? cur.centerFrequency : targetCenter.current
    const logSpan    = LOG_RANGE / baseZoom
    const logDelta   = -(dx / e.currentTarget.clientWidth) * logSpan
    commitZoom(Math.pow(10, Math.log10(Math.max(baseCenter, 1)) + logDelta), baseZoom, true)
  }, [commitZoom])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
    isRightDragging.current = false
  }, [])

  // ─── Touch pinch-zoom ────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const t0 = e.touches[0]
      const t1 = e.touches[1]
      if (!t0 || !t1) return
      lastPinchDistance.current = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      const t0 = e.touches[0]
      const t1 = e.touches[1]
      if (!t0 || !t1) return
      const dist  = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY)
      const scale = dist / lastPinchDistance.current
      lastPinchDistance.current = dist
      const cur      = useSpectrumStore.getState()
      const baseZoom = animationFrame.current === null ? cur.zoomLevel : targetZoom.current
      commitZoom(cur.centerFrequency, Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseZoom * scale)), true)
    }
  }, [commitZoom])

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null
  }, [])

  // ─── Keyboard navigation ─────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    const PAN_STEP  = 0.1
    const ZOOM_STEP = 1.35
    const cur        = useSpectrumStore.getState()
    const baseZoom   = animationFrame.current === null ? cur.zoomLevel       : targetZoom.current
    const baseCenter = animationFrame.current === null ? cur.centerFrequency : targetCenter.current
    const logCenter  = Math.log10(Math.max(baseCenter, 1))

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        commitZoom(Math.pow(10, logCenter + PAN_STEP), baseZoom)
        break
      case 'ArrowLeft':
        e.preventDefault()
        commitZoom(Math.pow(10, logCenter - PAN_STEP), baseZoom)
        break
      case '+': case '=':
        e.preventDefault()
        commitZoom(baseCenter, Math.min(MAX_ZOOM, baseZoom * ZOOM_STEP))
        break
      case '-': case '_':
        e.preventDefault()
        commitZoom(baseCenter, Math.max(MIN_ZOOM, baseZoom / ZOOM_STEP))
        break
      case 'Home':
        e.preventDefault()
        commitZoom(Math.pow(10, (LOG_MIN + LOG_MAX) / 2), 1)
        break
      case 'Escape':
        useSpectrumStore.getState().selectBand(null)
        break
      default:
        return
    }
  }, [commitZoom])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(urlDebounceTimer.current)
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    }
  }, [handleKeyDown])

  // Expose drag refs so SpectrumCanvas can show grab cursor
  return {
    zoomState,
    isDragging,
    isRightDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
