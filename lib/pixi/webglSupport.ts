/**
 * Synchronous pre-flight probe for *hardware* WebGL.
 *
 * Why this exists: on machines where GPU acceleration is unavailable (disabled,
 * blocklisted driver, remote desktop, some VMs), Chrome silently falls back to
 * SwiftShader — a software rasterizer. PixiJS then "initializes" by compiling
 * every shader on the CPU, which can block the main thread for tens of seconds.
 * While the main thread is blocked, setTimeout-based watchdogs cannot fire, so
 * the app would freeze on the loading skeleton with no escape.
 *
 * The probe asks for a context with `failIfMajorPerformanceCaveat: true`, which
 * makes getContext() return null *quickly* instead of handing us a software
 * context. We also check the unmasked renderer string against known software
 * rasterizers as a second line of defence. Runs BEFORE any PixiJS code.
 */
export interface WebGLSupport {
  ok: boolean
  reason?: string
  renderer?: string
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render|microsoft basic/i

export function probeHardwareWebGL(): WebGLSupport {
  if (typeof document === 'undefined') return { ok: false, reason: 'no DOM' }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  const attrs: WebGLContextAttributes = {
    failIfMajorPerformanceCaveat: true,
    powerPreference: 'high-performance',
  }

  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  try {
    gl =
      (canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ??
      (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null)
  } catch {
    return { ok: false, reason: 'context creation threw' }
  }

  if (!gl) {
    // Only a software (or no) context is available on this machine.
    return { ok: false, reason: 'no hardware-accelerated WebGL context' }
  }

  let rendererStr = ''
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    if (dbg) rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '')
  } catch {
    // Renderer string unavailable — the caveat flag above is still authoritative.
  }

  // Release the probe context so it never counts against the browser's context limit.
  try { gl.getExtension('WEBGL_lose_context')?.loseContext() } catch { /* best effort */ }

  if (rendererStr && SOFTWARE_RENDERER.test(rendererStr)) {
    return { ok: false, reason: `software renderer (${rendererStr})`, renderer: rendererStr }
  }

  return { ok: true, renderer: rendererStr || undefined }
}
