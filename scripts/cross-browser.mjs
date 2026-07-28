#!/usr/bin/env node
/**
 * Runs the deployed app on all three browser engines, desktop and phone, and audits
 * accessibility with axe-core.
 *
 * Chromium alone is not coverage: WebKit is what every iPhone runs, Gecko differs again,
 * and this app deliberately refuses software rendering — so whether each engine reaches
 * real WebGL, or drops to the 2D fallback, is exactly what needs measuring.
 *
 * Run:  node scripts/cross-browser.mjs [baseUrl]
 */
import { chromium, firefox, webkit, devices } from 'playwright'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const BASE = (process.argv.slice(2).find(a => !a.startsWith('--')) ?? 'https://wannabexaker.github.io/em-spectrum').replace(/\/$/, '')
const PAGE = `${BASE}/spectrum/`

const results = []
const record = (engine, form, name, ok, detail = '') => results.push({ engine, form, name, ok, detail })

/** What the page reports about itself once it has settled. */
const PROBE = `(() => {
  const c = document.querySelector('canvas');
  const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
  const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
  const header = document.querySelector('.spectrum-header');
  return {
    canvas: c ? c.width + 'x' + c.height : 'none',
    drawing: !!c && c.width > 0 && c.height > 0,
    renderer: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).slice(0, 60) : (gl ? 'webgl (masked)' : 'no-webgl'),
    fallback: /Try interactive mode|Safe Mode|INITIALIZING/i.test(document.body.innerText),
    buttons: document.querySelectorAll('button').length,
    headerWraps: header ? getComputedStyle(header).flexWrap : '?',
    sideScroll: document.documentElement.scrollWidth > window.innerWidth + 2,
    srList: document.querySelectorAll('.sr-contents-list button').length,
    liveRegion: !!document.querySelector('[role=status][aria-live]'),
    vw: window.innerWidth,
  };
})()`

async function run(engineName, launcher, launchOpts = {}) {
  let browser
  try {
    browser = await launcher.launch({ headless: true, ...launchOpts })
  } catch (e) {
    record(engineName, '-', 'engine launches', false, e.message.slice(0, 80))
    return
  }

  for (const [form, ctxOpts] of [
    ['desktop', { viewport: { width: 1440, height: 900 } }],
    ['phone', { ...devices['iPhone 13'], isMobile: engineName !== 'firefox', hasTouch: true }],
  ]) {
    const context = await browser.newContext(ctxOpts).catch(() => null)
    if (!context) { record(engineName, form, 'context created', false, 'unsupported emulation'); continue }
    const page = await context.newPage()
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
    page.on('pageerror', e => errors.push('EXC ' + String(e.message).slice(0, 120)))

    try {
      await page.goto(new URL(BASE).origin, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.evaluate(`localStorage.setItem('em-spectrum:onboarded:v1','true')`)
      await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(9000)

      const p = await page.evaluate(PROBE)
      record(engineName, form, 'canvas draws', p.drawing, p.canvas)
      record(engineName, form, 'real WebGL (not the 2D fallback)', !p.fallback, p.renderer)
      record(engineName, form, 'controls present', p.buttons > 20, `${p.buttons} buttons`)
      record(engineName, form, 'no horizontal page scroll', !p.sideScroll, `vw=${p.vw}`)
      record(engineName, form, 'screen-reader contents list populated', p.srList > 0, `${p.srList} entries`)
      record(engineName, form, 'live region present', p.liveRegion === true)
      if (form === 'phone') {
        record(engineName, form, 'toolbar wraps instead of clipping', p.headerWraps === 'wrap', p.headerWraps)
        const reachable = await page.evaluate(`(() => {
          const vw = window.innerWidth;
          const names = ['Educational','Professional','Hz','λ'];
          return names.every(n => {
            const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === n);
            if (!b) return false;
            const r = b.getBoundingClientRect();
            return r.left >= -1 && r.right <= vw + 1 && r.width > 0;
          });
        })()`)
        record(engineName, form, 'every mode/unit control inside the viewport', reachable === true)
      }

      // A deep-linked card must open and describe the right entry.
      await page.goto(`${PAGE}?edu=cat-purr`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(6000)
      const card = await page.evaluate(`(() => {
        const d = document.querySelector('[role=dialog]');
        return d ? d.innerText.replace(/\\s+/g, ' ').slice(0, 120) : 'NO_PANEL';
      })()`)
      record(engineName, form, 'deep-linked card opens with the right entry', /purr/i.test(card), card.slice(0, 60))

      // Touch, not a synthetic click: phones dispatch pointer/touch events.
      if (form === 'phone') {
        const tapped = await page.evaluate(`(() => {
          const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Professional');
          if (!b) return 'no-button';
          const r = b.getBoundingClientRect();
          return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
        })()`)
        if (tapped !== 'no-button') {
          const { x, y } = JSON.parse(tapped)
          await page.touchscreen.tap(x, y).catch(() => {})
          await page.waitForTimeout(1500)
          const mode = await page.evaluate(`(document.body.innerText.match(/(Educational|Professional) view/) || [''])[0]`)
          record(engineName, form, 'real touch tap switches mode', /Professional/.test(mode), mode || 'no readout')
        }
      }

      // axe-core, on the engine that supports it best.
      if (engineName === 'chromium') {
        await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 45000 })
        await page.waitForTimeout(8000)
        await page.addScriptTag({ content: axeSource })
        const axe = await page.evaluate(`axe.run(document, { resultTypes: ['violations'] }).then(r => JSON.stringify(
          r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help }))
        ))`)
        const violations = JSON.parse(axe)
        const serious = violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
        record(engineName, form, 'axe-core: no critical/serious violations', serious.length === 0,
          serious.length ? serious.map(v => `${v.id}(${v.n})`).join(', ') : `${violations.length} minor/moderate`)
        for (const v of violations) console.log(`   axe [${v.impact}] ${v.id} ×${v.n} — ${v.help}`)
      }

      const real = errors.filter(e => !/favicon|manifest|404|ERR_|Failed to load resource/i.test(e))
      record(engineName, form, 'no console errors', real.length === 0, real.slice(0, 2).join(' | '))
    } catch (e) {
      record(engineName, form, 'run completed', false, String(e.message).slice(0, 100))
    } finally {
      await context.close().catch(() => {})
    }
  }
  await browser.close().catch(() => {})
}

// Use the installed Chrome rather than downloading another Chromium.
await run('chromium', chromium, { channel: 'chrome' })
await run('firefox', firefox)
await run('webkit', webkit)

console.log(`\n${'='.repeat(74)}\nCROSS-BROWSER + ACCESSIBILITY — ${BASE}\n${'='.repeat(74)}`)
for (const engine of ['chromium', 'firefox', 'webkit']) {
  const rows = results.filter(r => r.engine === engine)
  if (!rows.length) continue
  console.log(`\n${engine.toUpperCase()}`)
  for (const r of rows) {
    console.log(`  ${r.ok ? '✓' : '✗'} [${r.form}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`)
  }
}
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
console.log(failed.length ? `\nFAILURES:\n${failed.map(f => `  ✗ [${f.engine}/${f.form}] ${f.name} — ${f.detail}`).join('\n')}` : '\nRESULT: CLEAN ✓')
process.exit(failed.length ? 1 : 0)
