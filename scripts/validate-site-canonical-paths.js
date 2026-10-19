#!/usr/bin/env node
'use strict'

const { normalizedPathname, SHORT_LEGAL_HTML } = require('./site-canonical-paths.js')

let failed = false

function fail(msg) {
  console.error(`validate-site-canonical-paths: ${msg}`)
  failed = true
}

const cases = [
  ['/privacy', '/privacy.html'],
  ['/privacy/', '/privacy.html'],
  ['/terms', '/terms.html'],
  ['/help', '/help.html'],
  ['/impressum', '/impressum.html'],
  ['/privacy.html', '/privacy.html'],
  ['/blog/', '/blog/'],
  ['/blog/slug/', '/blog/slug/'],
  ['/', '/'],
]

for (const [input, expected] of cases) {
  const actual = normalizedPathname(input)
  if (actual !== expected) fail(`${input} → ${actual}, expected ${expected}`)
}

for (const name of Object.keys(SHORT_LEGAL_HTML)) {
  const fs = require('fs')
  const path = require('path')
  const indexPath = path.join(__dirname, '..', name, 'index.html')
  if (!fs.existsSync(indexPath)) fail(`missing GitHub Pages stub ${name}/index.html`)
}

if (failed) process.exit(1)
console.log('validate-site-canonical-paths: PASS')
