// Minimal static server for the sweep. `npx serve` leaks a file descriptor per
// request and dies with EMFILE partway through a 510-entry run; readFile-based
// serving with an explicit 404 path does not.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, resolve, sep } from 'node:path'

const ROOT = resolve(process.argv[2])
const PORT = Number(process.argv[3] ?? 4176)
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
}

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (p.endsWith('/')) p += 'index.html'
    const abs = resolve(ROOT, '.' + p)
    if (abs !== ROOT && !abs.startsWith(ROOT + sep)) throw new Error('outside root')
    let body
    try {
      body = await readFile(abs)
    } catch {
      try { body = await readFile(abs + '.html') }
      catch { body = await readFile(join(abs, 'index.html')) }
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(abs) || '.html'] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('not found')
  }
}).listen(PORT, () => console.log(`static server on http://localhost:${PORT} serving ${ROOT}`))
