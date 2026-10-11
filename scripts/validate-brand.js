#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SKIP_DIRS = new Set(['.git', 'node_modules', 'branding', 'memory-bank'])
const SKIP_FILES = new Set([
  'scripts/brand-tokens.js',
  'scripts/validate-brand.js',
])
const EXT = new Set(['.html', '.css', '.js', '.webmanifest', '.json', '.tsx'])

const RETIRED_SUPABASE_LOGO =
  'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterLogoWeb.png'

const retiredPatterns = [
  { re: /#228[Bb]22/g, label: '#228B22' },
  { re: /#2[Dd][Aa]82[Dd]/g, label: '#2da82d' },
  { re: /rgba\(\s*34\s*,\s*139\s*,\s*34/g, label: 'rgba(34,139,34' },
  { re: /SkisterLogoWeb\.png/g, label: 'SkisterLogoWeb.png' },
  { re: new RegExp(RETIRED_SUPABASE_LOGO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), label: 'retired Supabase wordmark URL' },
]

const requiredFiles = [
  'assets/favicon.ico',
  'assets/favicon.png',
  'assets/skister-app-icon.png',
  'assets/skister-logo-white.png',
  'favicon.ico',
  'apple-touch-icon.png',
  'site.webmanifest',
]

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, files)
    else if (EXT.has(path.extname(name))) files.push(full)
  }
  return files
}

function relative(p) {
  return path.relative(ROOT, p)
}

let failed = false

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    console.error(`validate-brand: missing required file ${rel}`)
    failed = true
  }
}

const hits = []
for (const file of walk(ROOT)) {
  const rel = relative(file)
  if (SKIP_FILES.has(rel)) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const { re, label } of retiredPatterns) {
    if (re.test(text)) hits.push({ rel, label })
    re.lastIndex = 0
  }
}

if (hits.length) {
  failed = true
  console.error('validate-brand: retired brand references in active sources:')
  const byFile = new Map()
  for (const h of hits) {
    if (!byFile.has(h.rel)) byFile.set(h.rel, new Set())
    byFile.get(h.rel).add(h.label)
  }
  for (const [rel, labels] of [...byFile.entries()].sort()) {
    console.error(`  ${rel}: ${[...labels].join(', ')}`)
  }
}

if (failed) process.exit(1)
console.log('validate-brand: PASS')
