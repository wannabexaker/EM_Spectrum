import { clampFrequency, clampZoom, screenXToFreq, F_MIN, LOG_RANGE } from './logMapper'

export interface PanZoomState {
  centerFrequency: number
  zoomLevel: number
}

export function applyWheel(
  current: PanZoomState,
  deltaY: number,
  mouseX: number,
  viewportWidth: number
): PanZoomState {
  const zoomFactor = deltaY > 0 ? 0.9 : 1.1
  const newZoom = clampZoom(current.zoomLevel * zoomFactor)

  const freqUnderCursor = screenXToFreq(
    mouseX,
    viewportWidth,
    current.centerFrequency,
    current.zoomLevel
  )
  const logCursor = Math.log10(Math.max(freqUnderCursor, F_MIN))
  const logSpanNew = LOG_RANGE / newZoom
  const logCenterNew = logCursor - (mouseX / viewportWidth - 0.5) * logSpanNew
  const newCenter = clampFrequency(Math.pow(10, logCenterNew))

  return { centerFrequency: newCenter, zoomLevel: newZoom }
}

export function applyPan(
  current: PanZoomState,
  deltaX: number,
  viewportWidth: number
): PanZoomState {
  const logSpan = LOG_RANGE / current.zoomLevel
  const logDelta = -(deltaX / viewportWidth) * logSpan
  const logCenter = Math.log10(Math.max(current.centerFrequency, F_MIN)) + logDelta
  const newCenter = clampFrequency(Math.pow(10, logCenter))
  return { ...current, centerFrequency: newCenter }
}
