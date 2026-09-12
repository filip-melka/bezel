// Fails the build if any script, stylesheet or HTML file in dist/ references an
// external URL. Bezel makes zero network requests by design (SPEC §3) — fonts
// are bundled, not fetched from a CDN, and index.html is scanned so a <link> to
// a font or script host cannot slip past this check.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../dist', import.meta.url).pathname
const hits = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(js|css|html)$/.test(name)) scan(p)
  }
}

function scan(file) {
  const text = readFileSync(file, 'utf8')
  const re = /https?:\/\/[^\s"'`)]+/g
  let m
  while ((m = re.exec(text))) {
    const url = m[0]
    const before = text.slice(Math.max(0, m.index - 80), m.index)
    // Allow XML namespaces, license comments, and source-map pointers.
    // react.dev/errors is a documentation link inside React's minified error strings, never fetched.
    if (/w3\.org|creativecommons|opensource\.org|react\.dev\/errors|github\.com\/[\w-]+\/[\w-]+\/blob/.test(url)) continue
    if (/sourceMappingURL|@license|\* @|Copyright|MIT/i.test(before)) continue
    hits.push(`${file}: ${url}`)
  }
}

try {
  walk(root)
} catch (e) {
  console.error('check-no-network: dist/ not found, run vite build first')
  process.exit(1)
}

if (hits.length) {
  console.error('check-no-network: external URLs found in build output:')
  for (const h of hits) console.error('  ' + h)
  process.exit(1)
}
console.log('check-no-network: ok, no external URLs in dist/')
