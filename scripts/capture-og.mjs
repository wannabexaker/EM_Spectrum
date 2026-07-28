#!/usr/bin/env node
/**
 * Captures public/og/og-main.jpg — the social preview — as a real screenshot of the
 * deployed visualizer, chrome and all.
 *
 * Drives an installed Chromium over CDP rather than rasterising the DOM in-page: an
 * SVG/foreignObject capture cannot load the self-hosted webfonts, so the whole UI came out
 * in a fallback serif and misrepresented the app. Headless Chromium renders exactly what a
 * visitor sees.
 *
 * Run:  node scripts/capture-og.mjs [url]
 * Needs Chrome, Brave or Edge installed. No npm dependencies.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// The app rewrites f/z back to its own state on load, so pass a bare page and let it
// settle into the default view rather than pretending a deep link survives.
const URL_TO_SHOOT = process.argv[2] ?? 'https://wannabexaker.github.io/em-spectrum/spectrum/'
const OUT = join(ROOT, 'public/og/og-main.jpg')
const WIDTH = 1200
const HEIGHT = 630
const PORT = 9331

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

const exe = BROWSERS.find(p => existsSync(p))
if (!exe) {
  console.error('No Chromium-based browser found. Install Chrome, Brave or Edge.')
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'og-shot-'))
const child = spawn(exe, [
  '--headless=new',
  // Real GPU: the visualizer deliberately refuses software rendering and drops to its 2D
  // fallback, which is not what we want to advertise.
  '--enable-gpu',
  '--use-angle=d3d11',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  'about:blank',
], { stdio: 'ignore' })

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Poll the debug endpoint until the browser is listening. */
async function debugUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      return (await res.json()).webSocketDebuggerUrl
    } catch { await sleep(500) }
  }
  throw new Error('browser never opened its debugging port')
}

function cdp(ws) {
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    }
  })
  return (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const msgId = ++id
    pending.set(msgId, { resolve, reject })
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }))
  })
}

try {
  const wsUrl = await debugUrl()
  const ws = new WebSocket(wsUrl)
  await new Promise(r => ws.addEventListener('open', r))
  const send = cdp(ws)

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const call = (m, p) => send(m, p, sessionId)

  await call('Page.enable')
  await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false,
  })

  // Suppress the first-visit tour: it is a modal, and a fresh profile always gets it.
  const origin = new globalThis.URL(URL_TO_SHOOT).origin
  await call('Page.navigate', { url: origin })
  await sleep(1500)
  await call('Runtime.evaluate', {
    expression: `localStorage.setItem('em-spectrum:onboarded:v1','true')`,
  })

  await call('Page.navigate', { url: URL_TO_SHOOT })
  // WebGL init plus a settled render: the renderer only draws when it marks itself dirty.
  await sleep(9000)

  const probe = await call('Runtime.evaluate', {
    expression: `(() => {
      const c = document.querySelector('canvas');
      const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      const fallback = /interactive mode|Safe Mode|INITIALIZING/i.test(document.body.innerText);
      return JSON.stringify({
        canvas: c ? c.width + 'x' + c.height : 'none',
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a',
        fallbackVisible: fallback,
        tourVisible: /One axis|40 decades/.test(document.body.innerText),
      });
    })()`,
    returnByValue: true,
  })
  console.log('page state:', probe.result.value)

  const shot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 88, captureBeyondViewport: false })
  mkdirSync(join(ROOT, 'public/og'), { recursive: true })
  writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
  console.log(`wrote ${OUT} (${Buffer.from(shot.data, 'base64').length} bytes, ${WIDTH}x${HEIGHT})`)

  ws.close()
} finally {
  child.kill()
  try { rmSync(profile, { recursive: true, force: true }) } catch { /* profile lock */ }
}
