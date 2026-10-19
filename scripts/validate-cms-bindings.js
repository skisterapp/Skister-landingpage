#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
const adminJs = fs.readFileSync(path.join(ROOT, 'assets/landing-admin.js'), 'utf8')

const i18nKeys = new Set()
const re = /data-i18n="([^"]+)"/g
let m
while ((m = re.exec(indexHtml))) i18nKeys.add(m[1])

const keysMatch = adminJs.match(/const ALL_KEYS = \[([\s\S]*?)\];\s*\nconst KEY_LABELS/)
if (!keysMatch) {
  console.error('validate-cms-bindings: could not parse ALL_KEYS')
  process.exit(1)
}
const allKeys = []
const keyRe = /'([^']+)'/g
let km
while ((km = keyRe.exec(keysMatch[1]))) {
  if (km[1].includes('.')) allKeys.push(km[1])
}

const allSet = new Set(allKeys)
const requiredNavFooter = [
  'nav.howItWorks', 'nav.features', 'nav.tools', 'nav.faq', 'nav.blog', 'nav.contact', 'nav.download',
  'footer.tools', 'footer.features', 'footer.howItWorks', 'footer.faq', 'footer.download'
]

let failed = false
for (const key of requiredNavFooter) {
  if (!i18nKeys.has(key)) {
    console.error(`validate-cms-bindings: index.html missing data-i18n="${key}"`)
    failed = true
  }
  if (!allSet.has(key)) {
    console.error(`validate-cms-bindings: ALL_KEYS missing ${key}`)
    failed = true
  }
}

const legacy = ['nav.roadmap', 'footer.roadmap', 'roadmap.title']
for (const key of legacy) {
  if (allSet.has(key)) {
    console.error(`validate-cms-bindings: legacy key still in ALL_KEYS: ${key}`)
    failed = true
  }
  if (i18nKeys.has(key)) {
    console.error(`validate-cms-bindings: legacy key still on index.html: ${key}`)
    failed = true
  }
}

if (adminJs.indexOf('isLegacyCmsKey') === -1) {
  console.error('validate-cms-bindings: missing isLegacyCmsKey guard')
  failed = true
}

const translationsMatch = indexHtml.match(/const translations = (\{[\s\S]*?\n        \};)/)
if (!translationsMatch) {
  console.error('validate-cms-bindings: could not find translations object in index.html')
  failed = true
} else {
  try {
    vm.runInNewContext('const translations = ' + translationsMatch[1].replace(/;\s*$/, ''))
  } catch (err) {
    console.error('validate-cms-bindings: index.html translations object is invalid JS:', err.message)
    failed = true
  }
}

if (failed) process.exit(1)
console.log('validate-cms-bindings: PASS')
