#!/usr/bin/env node
/**
 * Educational-data integrity check.
 *
 * Guards the one mistake that is easy to make and hard to see: putting a
 * non-electromagnetic phenomenon (sound, seismic, mechanical, orbital, a
 * bioelectric rhythm) onto an EM lane. Acoustic frequencies (Hz–kHz) overlap
 * the radio ELF/VLF band numerically, so a plain range check is not enough —
 * hence the semantic rule (B).
 *
 * Run:  node scripts/validate-educational-data.mjs   (or: npm run validate:data)
 * Exit: 0 when clean, 1 when any hard error or review item remains.
 *
 * Lane ranges are mirrored from lib/spectrumLanes.ts — keep in sync if they change.
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'data/educationalExamples.ts'), 'utf8')

// [min, max] Hz per lane — mirror of SPECTRUM_LANES.
const LANES = {
  radio: [3, 3e9],
  microwave: [3e9, 3e12],
  infrared: [3e12, 4.3e14],
  visible: [4e14, 7.9e14],
  ultraviolet: [7.5e14, 3e16],
  xray: [3e16, 3e20],
  gamma: [3e19, 1e26],
  sound: [1e-14, 2e8], // "Audio / mechanical" — the home for every non-EM oscillation
}
const EM_LANES = new Set(['radio', 'microwave', 'infrared', 'visible', 'ultraviolet', 'xray', 'gamma'])

// A phenomenon that is mechanical/acoustic/biological/orbital in nature. If one of
// these sits on the radio or microwave lane it is almost certainly mislabeled and
// belongs on 'sound'. Restricted to radio+microwave so real light-biology
// (firefly, GFP, bee UV, aurora, Cherenkov on the visible/UV lanes) is never flagged.
const NON_EM = /whale|purr|cricket|woodpecker|wingbeat|mosquito|spider|termite|wolf|frog|cicada|dolphin|bat-echo|echolocation|ultrasound|-buzz|howl|drumming|thumping|headbang|footshak|jaw-tremor|ovipositor|substrate|elephant|hummingbird|electric-eel|electric-ray|weakly-electric|shark-electro|platypus|gecko|reptile|rabbit|hare|snake-jaw|rodent|voice|tremor|\becg\b|\beeg\b|atrial|ventricular|sleep-spindle|respiratory|heart-rate|heart|brain-wave|parkinson|magnetoreception|signature-whistle/i

// Parse the flat entry list.
const entries = []
const blocks = src.split(/\n {2}\{\n/).slice(1)
for (const b of blocks) {
  const id = (b.match(/id:\s*'([^']+)'/) || [])[1]
  if (!id) continue
  entries.push({
    id,
    label: (b.match(/label:\s*'([^']*)'/) || [])[1] || '',
    freq: Number((b.match(/frequency:\s*([0-9eE.+-]+)/) || [])[1]),
    cat: (b.match(/category:\s*'([^']+)'/) || [])[1],
    hasConfidence: /confidence:\s*'/.test(b),
    hasAtlas: /atlasCategory:\s*'/.test(b),
  })
}

const errors = [] // hard: wrong lane range, or unknown category
const review = [] // semantic: non-EM phenomenon on an EM lane
const overlaps = [] // info: two pins within 2% freq on the same lane

// Rules A + B
for (const e of entries) {
  const range = LANES[e.cat]
  if (!range) {
    errors.push(`${e.id}: unknown category '${e.cat}'`)
    continue
  }
  if (!(e.freq >= range[0] && e.freq <= range[1])) {
    errors.push(`${e.id}: ${e.freq.toExponential(2)} Hz outside ${e.cat} lane [${range[0]}, ${range[1]}]`)
  }
  if (EM_LANES.has(e.cat) && (e.cat === 'radio' || e.cat === 'microwave') && NON_EM.test(`${e.id} ${e.label}`)) {
    review.push(`${e.cat.padEnd(9)} ${e.freq.toExponential(2).padStart(9)}  ${e.id}`)
  }
}

// Rule C — near-duplicate frequency on the same lane (possible overlap / dup)
const byLane = {}
for (const e of entries) (byLane[e.cat] ||= []).push(e)
for (const lane of Object.values(byLane)) {
  lane.sort((a, b) => a.freq - b.freq)
  for (let i = 1; i < lane.length; i++) {
    const a = lane[i - 1], b = lane[i]
    if (a.freq > 0 && b.freq / a.freq < 1.02) overlaps.push(`${a.id} ~ ${b.id} (${a.freq.toExponential(2)} vs ${b.freq.toExponential(2)}, ${a.cat})`)
  }
}

const noConfidence = entries.filter(e => !e.hasConfidence).length

console.log(`educational-data: ${entries.length} entries`)
console.log(`  by lane: ${Object.entries(byLane).map(([k, v]) => `${k}=${v.length}`).join('  ')}`)

if (errors.length) {
  console.log(`\n✗ HARD ERRORS (frequency outside lane) — ${errors.length}:`)
  for (const m of errors) console.log('   ' + m)
}
if (review.length) {
  console.log(`\n⚠ REVIEW — non-EM phenomena still on an EM lane — ${review.length}:`)
  console.log('   (retag to category: \'sound\', or justify why it radiates EM at this frequency)')
  for (const m of review) console.log('   ' + m)
}
if (overlaps.length) {
  console.log(`\nℹ near-duplicate frequency on same lane — ${overlaps.length} (possible overlap / concept dup):`)
  for (const m of overlaps) console.log('   ' + m)
}
console.log(`\nℹ entries without a confidence tag: ${noConfidence}/${entries.length}`)

const blocking = errors.length + review.length
console.log(blocking ? `\nRESULT: ${blocking} blocking item(s) — not clean yet.` : `\nRESULT: clean ✓`)
process.exit(blocking ? 1 : 0)
