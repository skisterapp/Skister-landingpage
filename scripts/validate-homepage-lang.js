#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const indexPath = path.join(__dirname, '..', 'index.html')
const html = fs.readFileSync(indexPath, 'utf8')
let failed = false

function fail(msg) {
  console.error(`validate-homepage-lang: ${msg}`)
  failed = true
}

if (!/<html lang="de">/.test(html)) fail('expected <html lang="de">')
const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || ''
if (!title.includes('Skiausrüstung')) fail('default <title> should be German (Skiausrüstung)')
const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || ''
if (!desc.startsWith('Skister ist')) fail('default meta description should start with "Skister ist"')
const h1 = (html.match(/<h1[^>]*data-i18n="hero\.title"[^>]*>([^<]+)</) || [])[1] || ''
if (!h1.includes('Skiausrüstung')) fail('visible H1 default copy should be German')
if (!html.includes("'home.seo.title'")) fail('missing home.seo.title translation keys')
if (!html.includes('function applyHomeSeoMeta')) fail('missing applyHomeSeoMeta for language switching')

if (failed) process.exit(1)
console.log('validate-homepage-lang: PASS')
