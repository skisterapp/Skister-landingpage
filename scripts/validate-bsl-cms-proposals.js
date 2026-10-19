#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'cms-proposals', 'manifest.json'), 'utf8'))
const marker = manifest.safetyBlockInsert.markerId
const allSlugs = [
  ...Object.keys(manifest.fullBodyReplace),
  ...manifest.safetyBlockInsert.slugs,
]
let failed = false

function fail(msg) {
  console.error(`validate-bsl-cms-proposals: ${msg}`)
  failed = true
}

const pollution = /conversation-turn|data-message-author-role|text-token-text-primary/i

for (const slug of allSlugs) {
  const filePath = path.join(ROOT, 'blog', slug, 'index.html')
  const html = fs.readFileSync(filePath, 'utf8')
  const rel = path.relative(ROOT, filePath)
  if (pollution.test(html)) fail(`${rel}: ChatGPT export markup remains`)
  const body = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>([\s\S]*?)<aside class="product-soft-cta"/i) || [])[1] || ''
  const count = (body.match(new RegExp(`id="${marker}"`, 'g')) || []).length
  if (count !== 1) fail(`${rel}: expected 1 safety block (id=${marker}), found ${count}`)
  if (!body.includes('/blog/z-wert-kalkulator/')) fail(`${rel}: missing Z-Wert article link`)
  if (!/DIN ISO 11088/i.test(body)) fail(`${rel}: missing DIN ISO 11088 reference phrase`)
}

const s236 = fs.readFileSync(path.join(ROOT, 'blog/skischuhe-236-mm/index.html'), 'utf8')
if (!/Wo findest du die BSL/i.test(s236)) fail('236-mm: missing BSL marking section')
if (s236.length < 8000) fail('236-mm: body still suspiciously short after replace')

if (failed) process.exit(1)
console.log(`validate-bsl-cms-proposals: PASS (${allSlugs.length} articles)`)
