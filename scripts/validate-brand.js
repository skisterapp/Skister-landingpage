#!/usr/bin/env node
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const brand = require('./brand-tokens')

const ROOT = path.join(__dirname, '..')
const APPROVED_FAVICON_ICO_MD5 = '31b082d6d58d747dc89377a1f86eac45'
const RETIRED_MASCOT_FAVICON_ICO_MD5 = '0fd20c920fa3d1c9bafee4bc45f39bd8'
const SKIP_DIRS = new Set(['.git', 'node_modules', 'branding', 'memory-bank', 'build'])
const SKIP_FILES = new Set([
  'scripts/brand-tokens.js',
  'scripts/validate-brand.js',
  'assets/landing-admin.js',
])
const EXT = new Set(['.html', '.css', '.js', '.webmanifest', '.json', '.tsx'])

const RETIRED_SUPABASE_LOGO =
  'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterLogoWeb.png'
const RETIRED_HERO_CDN =
  'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterAppPro227.png'

const retiredPatterns = [
  { re: /#228[Bb]22/g, label: '#228B22' },
  { re: /#2[Dd][Aa]82[Dd]/g, label: '#2da82d' },
  { re: /rgba\(\s*34\s*,\s*139\s*,\s*34/g, label: 'rgba(34,139,34' },
  { re: /SkisterLogoWeb\.png/g, label: 'SkisterLogoWeb.png' },
  { re: new RegExp(RETIRED_SUPABASE_LOGO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), label: 'retired Supabase wordmark URL' },
  { re: new RegExp(RETIRED_HERO_CDN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), label: 'retired CDN hero mascot URL' },
  { re: /SkisterAppPro227\.png/g, label: 'SkisterAppPro227.png' },
]

const requiredFiles = [
  'assets/favicon.ico',
  'assets/favicon.png',
  'assets/skister-app-icon.png',
  'assets/skister-logo-white.png',
  'assets/hero-mascot.png',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'site.webmanifest',
]

function md5File(rel) {
  const buf = fs.readFileSync(path.join(ROOT, rel))
  return crypto.createHash('md5').update(buf).digest('hex')
}

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

for (const rel of ['favicon.ico', 'assets/favicon.ico']) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue
  const hash = md5File(rel)
  if (hash === RETIRED_MASCOT_FAVICON_ICO_MD5) {
    console.error(`validate-brand: ${rel} is retired mascot favicon (IconKitchen)`)
    failed = true
  } else if (hash !== APPROVED_FAVICON_ICO_MD5) {
    console.error(`validate-brand: ${rel} md5 ${hash} does not match approved favicon`)
    failed = true
  }
}

const indexHtml = path.join(ROOT, 'index.html')
if (fs.existsSync(indexHtml)) {
  const indexText = fs.readFileSync(indexHtml, 'utf8')
  const v = brand.faviconAssetVersion
  if (!indexText.includes(`favicon.ico?v=${v}`)) {
    console.error('validate-brand: index.html missing versioned favicon.ico reference')
    failed = true
  }
  if (indexText.includes('assets/favicon.ico') && indexText.match(/rel="icon"[^>]*assets\/favicon\.ico/)) {
    console.error('validate-brand: index.html should not use assets/favicon.ico as primary icon')
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
