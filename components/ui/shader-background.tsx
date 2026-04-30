'use client'

import { useEffect, useRef } from 'react'

// ─── GLSL ────────────────────────────────────────────────────────────────────

const VS = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`

const FS = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  const float overallSpeed      = 0.2;
  const float gridSmoothWidth   = 0.015;
  const float axisWidth         = 0.05;
  const float majorLineWidth    = 0.025;
  const float minorLineWidth    = 0.0125;
  const float majorLineFrequency = 5.0;
  const float minorLineFrequency = 1.0;
  const float scale             = 5.0;
  const vec4  lineColor         = vec4(0.4, 0.2, 0.8, 1.0);
  const float minLineWidth      = 0.01;
  const float maxLineWidth      = 0.2;
  const float lineSpeed         = 1.0 * overallSpeed;
  const float lineAmplitude     = 1.0;
  const float lineFrequency     = 0.2;
  const float warpSpeed         = 0.2 * overallSpeed;
  const float warpFrequency     = 0.5;
  const float warpAmplitude     = 1.0;
  const float offsetFrequency   = 0.5;
  const float offsetSpeed       = 1.33 * overallSpeed;
  const float minOffsetSpread   = 0.6;
  const float maxOffsetSpread   = 2.0;
  const int   linesPerGroup     = 16;

  #define drawCircle(pos, radius, coord)  smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos, hw, t)      smoothstep(hw, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, hw, t)       smoothstep(hw + gridSmoothWidth, hw, abs(pos - (t)))
  #define drawPeriodicLine(freq, w, t)    drawCrispLine(freq / 2.0, w, abs(mod(t, freq) - (freq) / 2.0))

  float drawGridLines(float axis) {
    return drawCrispLine(0.0, axisWidth, axis)
         + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
         + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
  }

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float hFade, float offset) {
    return random(x * lineFrequency + iTime * lineSpeed) * hFade * lineAmplitude + offset;
  }

  void main() {
    vec2 uv    = gl_FragCoord.xy / iResolution.xy;
    vec2 space = (gl_FragCoord.xy - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

    float hFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float vFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + hFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * hFade;

    vec4 lines = vec4(0.0);

    for (int l = 0; l < linesPerGroup; l++) {
      float ni          = float(l) / float(linesPerGroup);
      float offsetTime  = iTime * offsetSpeed;
      float offsetPos   = float(l) + space.x * offsetFrequency;
      float rand        = random(offsetPos + offsetTime) * 0.5 + 0.5;
      float halfWidth   = mix(minLineWidth, maxLineWidth, rand * hFade) / 2.0;
      float offset      = random(offsetPos + offsetTime * (1.0 + ni)) * mix(minOffsetSpread, maxOffsetSpread, hFade);
      float linePos     = getPlasmaY(space.x, hFade, offset);
      float line        = drawSmoothLine(linePos, halfWidth, space.y) / 2.0
                        + drawCrispLine(linePos, halfWidth * 0.15, space.y);

      float cx          = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
      vec2  cp          = vec2(cx, getPlasmaY(cx, hFade, offset));
      float circle      = drawCircle(cp, 0.01, space) * 4.0;

      lines += (line + circle) * lineColor * rand;
    }

    vec4 color = mix(vec4(0.1, 0.1, 0.3, 1.0), vec4(0.3, 0.1, 0.5, 1.0), uv.x);
    color *= vFade;
    color.a = 1.0;
    color  += lines;

    // Reduce overall brightness so text remains legible above the shader
    gl_FragColor = vec4(color.rgb * 0.72, 1.0);
  }
`

// ─── WebGL helpers ────────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[ShaderBg] compile:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VS)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS)
  if (!vs || !fs) return null

  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('[ShaderBg] link:', gl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // body { background: #050508 } is a block-level background that paints ABOVE
    // position:fixed z-index:-10 elements in the root stacking context, covering
    // the shader entirely. Make it transparent so the canvas shows through.
    // html { background } becomes the viewport canvas and stays as the dark fallback.
    const prevBodyBg = document.body.style.background
    document.body.style.background = 'transparent'

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.warn('[ShaderBg] WebGL not available — falling back to CSS background.')
      document.body.style.background = prevBodyBg
      return
    }

    const prog = buildProgram(gl)
    if (!prog) return

    // Full-screen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const aPos   = gl.getAttribLocation(prog, 'aVertexPosition')
    const uRes   = gl.getUniformLocation(prog, 'iResolution')
    const uTime  = gl.getUniformLocation(prog, 'iTime')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize)
    resize()

    const t0 = performance.now()
    let rafId = 0

    const render = () => {
      const t = (performance.now() - t0) / 1000

      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(prog)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)

      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(aPos)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
      // Restore body background when leaving the landing page
      document.body.style.background = prevBodyBg
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    />
  )
}
