#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const indexPath = path.join(__dirname, '..', 'index.html')
const html = fs.readFileSync(indexPath, 'utf8')
const langs = ['de', 'en', 'fr', 'es', 'it']
const requiredKeys = [
  'messages.success',
  'messages.duplicate',
  'messages.error',
  'messages.serverError',
  'messages.sending',
  'hero.submitBtn',
  'nav.menuOpen',
  'nav.menuClose',
]

let failed = false

function fail(msg) {
  console.error(`validate-homepage-translations: ${msg}`)
  failed = true
}

function extractLangBlock(lang) {
  const marker = `${lang}: {`
  const start = html.indexOf(marker)
  if (start === -1) return ''
  let depth = 0
  let i = start + marker.length - 1
  for (; i < html.length; i++) {
    const ch = html[i]
    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) return html.slice(start, i + 1)
    }
  }
  return ''
}

for (const lang of langs) {
  const block = extractLangBlock(lang)
  if (!block) {
    fail(`missing translations.${lang} block`)
    continue
  }
  for (const key of requiredKeys) {
    if (!block.includes(`'${key}':`)) fail(`missing ${lang} key ${key}`)
  }
}

if (!html.includes('<button type="button" class="language-option"')) {
  fail('homepage language options should be keyboard-focusable buttons')
}

if (failed) process.exit(1)
console.log('validate-homepage-translations: PASS')
