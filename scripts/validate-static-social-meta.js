#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { defaultOgImageUrl } = require('./site-social-defaults')

const ROOT = path.join(__dirname, '..')
const pages = [
  { file: 'blog/index.html', url: 'https://skister.app/blog/' },
  { file: 'help.html', url: 'https://skister.app/help.html' },
  { file: 'privacy.html', url: 'https://skister.app/privacy.html' },
  { file: 'terms.html', url: 'https://skister.app/terms.html' },
]
const defaultImage = defaultOgImageUrl()
let failed = false

function fail(msg) {
  console.error(`validate-static-social-meta: ${msg}`)
  failed = true
}

for (const { file, url } of pages) {
  const filePath = path.join(ROOT, file)
  const html = fs.readFileSync(filePath, 'utf8')
  const og = (html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || [])[1]
  const tw = (html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) || [])[1]
  if (!og || !og.startsWith('https://')) fail(`${file}: missing or non-HTTPS og:image`)
  if (!tw || !tw.startsWith('https://')) fail(`${file}: missing or non-HTTPS twitter:image`)
  if (og !== tw) fail(`${file}: og:image and twitter:image should match`)
  if (!html.includes(url)) fail(`${file}: expected canonical/og:url reference to ${url}`)
}

if (!defaultImage.startsWith('https://skister.app/')) {
  fail('defaultOgImageUrl must be absolute HTTPS on skister.app')
}

if (failed) process.exit(1)
console.log('validate-static-social-meta: PASS')
