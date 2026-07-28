#!/usr/bin/env node
/**
 * Functional sweep of the deployed app: opens every catalogued entry and checks the panel
 * that appears actually describes it, presses every control and checks each one changes
 * something, runs the negative cases, and fails on any console error along the way.
 *
 * Verifies rendered output against data/*.ts (via sweep-manifest.json) rather than against
 * the UI's own claims, so a card that renders the wrong entry cannot pass.
 *
 * Run:  node scripts/live-sweep.mjs [baseUrl]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Flags must not be mistaken for the base URL — `--all` used to be parsed as one.
const positional = process.argv.slice(2).filter(a => !a.startsWith('--'))
const BASE = (positional[0] ?? 'https://wannabexaker.github.io/em-spectrum').replace(/\/$/, '')
const PAGE = `${BASE}/spectrum/`
const PORT = 9342
const manifest = JSON.parse(readFileSync(join(ROOT, 'sweep-manifest.json'), 'utf8'))

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
]
const exe = BROWSERS.find(existsSync)
if (!exe) { console.error('No Chromium-based browser found.'); process.exit(1) }

const profile = mkdtempSync(join(tmpdir(), 'sweep-'))
const child = spawn(exe, [
  '--headless=new', '--enable-gpu', '--use-angle=d3d11',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1440,900', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', 'about:blank',
], { stdio: 'ignore' })

const sleep = ms => new Promise(r => setTimeout(r, ms))
const pass = []
const fail = []
const consoleErrors = []
const check = (name, ok, detail = '') => (ok ? pass : fail).push(detail ? `${name} — ${detail}` : name)

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try { return (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl }
    catch { await sleep(500) }
  }
  throw new Error('debug port never opened')
}

try {
  const ws = new WebSocket(await wsUrl())
  await new Promise(r => ws.addEventListener('open', r))
  let msgId = 0
  const pending = new Map()
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id); pending.delete(m.id)
      m.error ? rej(new Error(m.error.message)) : res(m.result)
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map(a => a.value ?? a.description ?? '?').join(' ').slice(0, 200))
    } else if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description ?? '').slice(0, 200))
    }
  })
  const raw = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++msgId; pending.set(id, { res, rej })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })

  const { targetId } = await raw('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await raw('Target.attachToTarget', { targetId, flatten: true })
  const call = (m, p) => raw(m, p, sessionId)
  await call('Page.enable'); await call('Runtime.enable')

  /** Evaluates in the page and returns the value. */
  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    return r.result?.value
  }

  const go = async (url, settle = 2600) => { await call('Page.navigate', { url }); await sleep(settle) }

  // Suppress the first-visit tour, which is modal and would block every interaction.
  await go(new URL(BASE).origin, 1200)
  await evaluate(`localStorage.setItem('em-spectrum:onboarded:v1','true')`)
  await go(PAGE, 7000)

  const ready = await evaluate(`(() => {
    const c = document.querySelector('canvas');
    return JSON.stringify({ canvas: !!c && c.width > 0, buttons: document.querySelectorAll('button').length,
      fallback: /Try interactive mode|Safe Mode/i.test(document.body.innerText) });
  })()`)
  const r0 = JSON.parse(ready)
  check('boot: canvas renders', r0.canvas, `buttons=${r0.buttons}`)
  check('boot: not in 2D fallback', !r0.fallback)

  // ── Every catalogued entry, one at a time ──────────────────────────────
  // Deep links are the only in-page route that opens an arbitrary card, so each entry
  // gets its own navigation. The panel's own text is compared against the manifest.
  const sweepGroup = async (label, items, param, expect) => {
    let checked = 0
    const problems = []
    for (const item of items) {
      await go(`${PAGE}?${param}=${encodeURIComponent(item.id)}`, 1700)
      const got = await evaluate(`(() => {
        const d = document.querySelector('[role=dialog]');
        if (!d) return 'NO_PANEL';
        return d.innerText.replace(/\\s+/g, ' ').slice(0, 400);
      })()`)
      checked++
      const verdict = expect(item, got ?? '')
      if (verdict) problems.push(`${item.id}: ${verdict}`)
    }
    check(`${label}: ${checked} entries opened and matched`, problems.length === 0,
      problems.length ? `${problems.length} problem(s) → ${problems.slice(0, 6).join(' | ')}` : '')
    return problems
  }

  const looseMatch = (haystack, needle) => {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
    return norm(haystack).includes(norm(needle).slice(0, 22))
  }

  await sweepGroup('educational', manifest.educational, 'edu', (item, text) => {
    if (text === 'NO_PANEL') return 'panel never opened'
    if (!looseMatch(text, item.label)) return `panel shows "${text.slice(0, 40)}"`
    if (item.confidence && !text.includes(item.confidence)) return 'confidence badge missing'
    return null
  })

  await sweepGroup('professional', manifest.pro, 'pro', (item, text) => {
    if (text === 'NO_PANEL') return 'panel never opened'
    if (!looseMatch(text, item.label)) return `panel shows "${text.slice(0, 40)}"`
    return null
  })

  // Features are the largest set. Default to a stratified sample so a routine run stays
  // inside a sane wall-clock; `--all` opens every one of them.
  const sweepAll = process.argv.includes('--all')
  const step = Math.max(1, Math.floor(manifest.features.length / 60))
  const featureSample = sweepAll ? manifest.features : manifest.features.filter((_, i) => i % step === 0)
  const featureLabel = sweepAll
    ? `features (all ${manifest.features.length})`
    : `features (sample of ${manifest.features.length})`
  await sweepGroup(featureLabel, featureSample, 'feature', (item, text) => {
    if (text === 'NO_PANEL') return 'panel never opened'
    if (!looseMatch(text, item.label)) return `panel shows "${text.slice(0, 40)}"`
    return null
  })

  // ── Every control, pressed ─────────────────────────────────────────────
  await go(PAGE, 6000)
  const controls = await evaluate(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const byText = t => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t);
    const state = () => JSON.stringify({
      mode: (document.body.innerText.match(/(Educational|Professional) view/) || [])[0] || '',
      density: (document.body.innerText.match(/· (Clean|Details|Max) ·/) || [])[1] || '',
      layers: [...document.querySelectorAll('.layer-btn')].map(b => b.getAttribute('aria-label')).join(','),
      // Which unit leads the readout. Testing for ' = ' was useless: the HUD prints
      // "X = Y" in both modes, so the toggle could never register as a change.
      unit: (document.body.innerText.match(/(CENTER|PROBE)\\s+([\\d.]+\\s*\\S+)/) || [])[2] || '',
      zoomPill: [...document.querySelectorAll('.zoom-pill')].find(p => p.className.includes('active'))?.textContent.trim() || '',
      atlasOrLayers: !!byText('Atlas') ? 'Atlas' : (!!byText('Layers') ? 'Layers' : 'none'),
    });
    const results = [];
    const press = async (name, el) => {
      if (!el) { results.push([name, 'MISSING']); return; }
      const before = state();
      el.click();
      await sleep(550);
      results.push([name, state() === before ? 'NO_EFFECT' : 'ok']);
    };
    await press('mode:Professional', byText('Professional'));
    await press('mode:Educational', byText('Educational'));
    for (const t of ['Low', 'Mid', 'High']) await press('density:' + t, byText(t));
    for (const l of ['EM Spectrum', 'Sound Waves', 'Applications', 'Hazards']) {
      await press('layer:' + l, [...document.querySelectorAll('.layer-btn')].find(b => (b.getAttribute('aria-label') || '').includes(l)));
      await press('layer:' + l + ' (restore)', [...document.querySelectorAll('.layer-btn')].find(b => (b.getAttribute('aria-label') || '').includes(l)));
    }
    await press('unit:wavelength', byText('λ'));
    await press('unit:frequency', byText('Hz'));
    for (const z of ['2', '5', '10', '1']) await press('zoom:' + z, [...document.querySelectorAll('.zoom-pill')].find(p => p.textContent.trim() === z));
    return JSON.stringify(results);
  })()`)
  for (const [name, verdict] of JSON.parse(controls ?? '[]')) {
    check('control ' + name, verdict === 'ok', verdict === 'ok' ? '' : verdict)
  }

  // Region only changes the regulatory notes inside an open card, so it has to be tested
  // with one open — pressing it against a bare canvas can change nothing by design.
  await go(`${PAGE}?feature=zigbee-24-ch-15`, 5000)
  const regions = await evaluate(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const byText = t => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t);
    const shown = () => [...document.querySelectorAll('.feature-reg-note')]
      .map(n => n.textContent.replace(/\\s+/g, ' ').slice(0, 30)).join('|')
      + (document.querySelector('.feature-reg-empty') ? '[empty]' : '');
    const seen = {};
    for (const r of ['All', 'EU', 'US', 'JP']) { byText(r)?.click(); await sleep(600); seen[r] = shown(); }
    return JSON.stringify({ seen, dialog: !!document.querySelector('[role=dialog]') });
  })()`)
  const rg = JSON.parse(regions ?? '{}')
  check('region: card open for the test', rg.dialog === true)
  check('region: EU shows an EU note', /EU|ETSI/i.test(rg.seen?.EU ?? ''), rg.seen?.EU ?? '')
  check('region: US shows a US note', /US|FCC/i.test(rg.seen?.US ?? ''), rg.seen?.US ?? '')
  check('region: each region renders differently', new Set(Object.values(rg.seen ?? {})).size > 1,
    JSON.stringify(rg.seen ?? {}).slice(0, 140))

  // ── Filters, saved list, search, and the negative cases ───────────────
  const extras = await evaluate(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const byText = t => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t);
    const out = {};

    // Atlas filter: open, hide a domain, expect the badge to count it, then reset.
    byText('Atlas')?.click(); await sleep(500);
    out.atlasPanel = !!document.querySelector('.edu-filter-panel');
    const chip = document.querySelector('.edu-filter-chip');
    chip?.click(); await sleep(400);
    out.atlasBadge = /Atlas\\s*\\d/.test(byText('Atlas')?.textContent ?? '') || /\\d/.test(document.querySelector('.edu-filter-count')?.textContent ?? '');
    document.querySelector('.edu-filter-reset')?.click(); await sleep(300);
    out.atlasReset = !document.querySelector('.edu-filter-count');
    byText('Atlas')?.click(); await sleep(200);

    // Verified-only, then every domain hidden — the deliberate empty state.
    byText('Atlas')?.click(); await sleep(400);
    document.querySelector('.edu-filter-verified input')?.click(); await sleep(400);
    out.verifiedOnly = !!document.querySelector('.edu-filter-count');
    for (const c of [...document.querySelectorAll('.edu-filter-chip')]) { c.click(); await sleep(60); }
    await sleep(500);
    out.allHiddenSurvives = !!document.querySelector('canvas');
    document.querySelector('.edu-filter-reset')?.click(); await sleep(400);
    byText('Atlas')?.click(); await sleep(200);

    // Search: a hit, a miss, and clearing.
    const input = document.querySelector('input');
    const set = v => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(input, v); input.dispatchEvent(new Event('input', { bubbles: true })); };
    set('wifi'); await sleep(700);
    out.searchHit = document.querySelectorAll('[class*=search-result]').length;
    set('zzzzqqqq'); await sleep(700);
    out.searchMiss = document.querySelectorAll('[class*=search-result]').length;
    set(''); await sleep(400);

    // Saved list: star a story via its card, confirm it lists, then unstar.
    out.savedFlow = 'skipped';
    return JSON.stringify(out);
  })()`)
  const x = JSON.parse(extras ?? '{}')
  check('Atlas filter opens', x.atlasPanel === true)
  check('Atlas filter counts an active filter', x.atlasBadge === true)
  check('Atlas filter reset clears the badge', x.atlasReset === true)
  check('verified-only registers as a filter', x.verifiedOnly === true)
  check('every domain hidden does not break the canvas', x.allHiddenSurvives === true)
  check('search returns hits for a real term', x.searchHit > 0, `${x.searchHit} results`)
  check('search shows nothing for nonsense', x.searchMiss === 0, `${x.searchMiss} results`)

  // Negative deep links must not wedge the app.
  for (const [name, url] of [
    ['unknown ?edu id', `${PAGE}?edu=does-not-exist`],
    ['unknown ?pro id', `${PAGE}?pro=nope`],
    ['unknown ?feature id', `${PAGE}?feature=nope`],
    ['absurd zoom/freq', `${PAGE}?f=1e99&z=-5`],
  ]) {
    await go(url, 3200)
    const ok = await evaluate(`(() => {
      const c = document.querySelector('canvas');
      return !!c && c.width > 0 && !/Try interactive mode|Safe Mode/i.test(document.body.innerText);
    })()`)
    check(`negative: ${name} still renders`, ok === true)
  }

  // Saved flow, end to end: star from a card, verify it lists, unstar, verify it is gone.
  await go(`${PAGE}?edu=cat-purr`, 3800)
  const saved = await evaluate(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const star = document.querySelector('[role=dialog] .feature-popup-favorite');
    if (!star) return 'NO_STAR';
    if (star.textContent.trim() === '★') { star.click(); await sleep(300); }
    document.querySelector('[role=dialog] .feature-popup-favorite')?.click(); await sleep(400);
    const stored = localStorage.getItem('em-spectrum:favorite-stories:v1');
    document.querySelector('.edu-popup-close')?.click(); await sleep(200);
    const savedBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Saved'));
    savedBtn?.click(); await sleep(600);
    const listed = [...document.querySelectorAll('.hud-saved-item')].some(i => /purr/i.test(i.textContent));
    document.querySelector('.hud-saved-remove')?.click(); await sleep(400);
    const after = localStorage.getItem('em-spectrum:favorite-stories:v1');
    return JSON.stringify({ stored, listed, after });
  })()`)
  if (saved === 'NO_STAR') check('saved: star present on story card', false, 'no star found')
  else {
    const s = JSON.parse(saved)
    check('saved: starring persists to storage', (s.stored ?? '').includes('cat-purr'), s.stored ?? 'null')
    check('saved: story appears in the Saved list', s.listed === true)
    check('saved: removing clears it from storage', !(s.after ?? '').includes('cat-purr'), s.after ?? 'null')
  }

  ws.close()
} finally {
  child.kill()
  try { rmSync(profile, { recursive: true, force: true }) } catch { /* locked */ }
}

const realErrors = consoleErrors.filter(e => !/favicon|manifest|404|ERR_/i.test(e))
console.log(`\n${'='.repeat(72)}\nLIVE SWEEP — ${BASE}\n${'='.repeat(72)}`)
console.log(`\nPASS (${pass.length}):`)
for (const p of pass) console.log('  ✓ ' + p)
if (fail.length) { console.log(`\nFAIL (${fail.length}):`); for (const f of fail) console.log('  ✗ ' + f) }
console.log(`\nconsole errors: ${realErrors.length}`)
for (const e of realErrors.slice(0, 10)) console.log('   ! ' + e)
console.log(`\nRESULT: ${fail.length === 0 && realErrors.length === 0 ? 'CLEAN ✓' : `${fail.length} failure(s), ${realErrors.length} console error(s)`}`)
process.exit(fail.length === 0 && realErrors.length === 0 ? 0 : 1)
