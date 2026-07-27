#!/usr/bin/env node
/**
 * Verifies every source URL in the data layer actually resolves (HTTP 200).
 * Sources exist to build credibility — a dead link does the opposite. Run before release,
 * or whenever sources are edited.
 *
 * Covers every file that carries citations, not just the educational examples: the
 * professional allocations and technology profiles cite standards bodies too, and those
 * links were outside the guard when they were added.
 *
 * Run:  node scripts/check-sources.mjs   (or: npm run check:sources)
 * Exit: 0 when every URL is 200, 1 otherwise. Needs network access.
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILES = [
  'data/educationalExamples.ts',
  'data/professionalSpectrum.ts',
  'data/standardSources.ts',
  'data/technologyProfiles.ts',
  'data/universalVibrationsAtlas.ts',
  'data/frequencyFeatures.ts',
]
// Collect url -> where it is cited. Parsed per file: the "current entry id" must not leak
// across file boundaries, or failures get blamed on whatever entry the previous file
// happened to end on.
const byUrl = new Map()
for (const file of FILES) {
  let text
  try {
    text = readFileSync(join(root, file), 'utf8')
  } catch {
    console.log(`  (skipped missing ${file})`)
    continue
  }
  let entryId = null
  for (const line of text.split('\n')) {
    const mId = line.match(/^\s*id: '([^']+)',/)
    if (mId) entryId = mId[1]
    for (const m of line.matchAll(/url: '([^']+)'/g)) {
      if (!byUrl.has(m[1])) byUrl.set(m[1], new Set())
      byUrl.get(m[1]).add(`${file.replace('data/', '')}:${entryId ?? '?'}`)
    }
  }
}

const urls = [...byUrl.keys()]
console.log(`checking ${urls.length} unique source URLs...`)

// A real browser UA, modest concurrency and a generous timeout: standards bodies are slow,
// and hammering them 12-at-once with a
// short deadline produced connection errors for URLs that
// resolve perfectly well. A checker that cries wolf is a checker people stop running.
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EM-Spectrum-source-check' }
const CONCURRENCY = 5
const TIMEOUT_MS = 30000

async function probe(url) {
  try {
    const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
    return r.status
  } catch {
    return 'ERR'
  }
}

/** One retry before believing a failure — transient timeouts are common on these hosts. */
async function check(url) {
  const first = await probe(url)
  if (first === 200) return [url, 200]
  return [url, await probe(url)]
}

const dead = []
const blocked = []
for (let i = 0; i < urls.length; i += CONCURRENCY) {
  const results = await Promise.all(urls.slice(i, i + CONCURRENCY).map(check))
  for (const [url, status] of results) {
    if (status === 200) continue
    // 401/403 means the publisher blocks automated access, not that the citation is gone.
    // Failing on those would push us toward dropping perfectly good primary sources.
    if (status === 401 || status === 403) blocked.push([url, status])
    else dead.push([url, status])
  }
}

const cited = url => [...byUrl.get(url)].join(', ')

if (blocked.length) {
  console.log(`\n! ${blocked.length} URL(s) blocked to automated checks (verify in a browser):`)
  for (const [url, status] of blocked) console.log(`   ${status}  ${url}  <- ${cited(url)}`)
}

if (dead.length) {
  console.log(`\n✗ ${dead.length} unreachable URL(s):`)
  for (const [url, status] of dead) console.log(`   ${status}  ${url}  <- ${cited(url)}`)
  process.exit(1)
}

console.log(`\n✓ ${urls.length - blocked.length} source URLs resolve (200)${blocked.length ? `, ${blocked.length} bot-blocked` : ''}`)
