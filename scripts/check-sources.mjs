#!/usr/bin/env node
/**
 * Verifies every `sources[].url` in data/educationalExamples.ts actually resolves (HTTP 200).
 * Sources exist to build credibility — a dead link does the opposite. Run before release,
 * or whenever sources are edited.
 *
 * Run:  node scripts/check-sources.mjs   (or: npm run check:sources)
 * Exit: 0 when every URL is 200, 1 otherwise. Needs network access.
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'data/educationalExamples.ts'), 'utf8')

// Collect url -> the entry ids that cite it (for readable failure output).
const byUrl = new Map()
let entryId = null
for (const line of src.split('\n')) {
  const mId = line.match(/^\s*id: '([^']+)',/)
  if (mId) entryId = mId[1]
  for (const m of line.matchAll(/url: '([^']+)'/g)) {
    if (!byUrl.has(m[1])) byUrl.set(m[1], new Set())
    byUrl.get(m[1]).add(entryId)
  }
}
const urls = [...byUrl.keys()]
console.log(`checking ${urls.length} unique source URLs...`)

const UA = { 'User-Agent': 'Mozilla/5.0 EM-Spectrum-source-check' }
const fails = []
for (let i = 0; i < urls.length; i += 12) {
  const batch = urls.slice(i, i + 12)
  const res = await Promise.all(batch.map(async u => {
    try { const r = await fetch(u, { headers: UA, redirect: 'follow' }); return [u, r.status] }
    catch { return [u, 'ERR'] }
  }))
  for (const [u, st] of res) if (st !== 200) fails.push([u, st])
}

if (fails.length) {
  console.log(`\n✗ ${fails.length} unreachable URL(s):`)
  for (const [u, s] of fails) console.log(`   ${s}  ${u}  <- ${[...byUrl.get(u)].join(', ')}`)
  process.exit(1)
}
console.log('\n✓ all source URLs resolve (200)')
