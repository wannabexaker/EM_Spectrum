'use client'

import { useState, useEffect, RefObject } from 'react'
import type { ViewportDimensions } from '@/types/spectrum'

const THROTTLE_MS = 100

export function useViewport(ref: RefObject<HTMLCanvasElement | null>): ViewportDimensions {
  const [dimensions, setDimensions] = useState<ViewportDimensions>({
    width: 0,
    height: 0,
    pixelRatio: 1,
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let throttleTimer: ReturnType<typeof setTimeout> | null = null

    const update = () => {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
        pixelRatio: window.devicePixelRatio || 1,
      })
    }

    const throttled = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        update()
      }, THROTTLE_MS)
    }

    const observer = new ResizeObserver(throttled)
    observer.observe(el)
    update()

    return () => {
      observer.disconnect()
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [ref])

  return dimensions
}
