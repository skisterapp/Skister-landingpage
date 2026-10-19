#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const files = ['privacy.html', 'terms.html', 'help.html']
let failed = false

function fail(msg) {
  console.error(`validate-legal-shell: ${msg}`)
  failed = true
}

for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8')
  if (!html.includes('legal-page-shell.css')) fail(`${file} missing legal-page-shell.css`)
  if (!html.includes('legal-page-shell.js')) fail(`${file} missing legal-page-shell.js`)
  if (!html.includes('id="nav-menu-toggle"')) fail(`${file} missing mobile nav toggle`)
  if (!html.includes('id="primary-nav-links"')) fail(`${file} missing primary nav links container`)
  if (!html.includes('language-option-btn')) fail(`${file} missing accessible language option buttons`)
  if (!html.includes('legal-nav-trailing')) fail(`${file} language selector must sit outside hidden nav-links`)
  if (html.match(/@media \(max-width: 768px\)[\s\S]*\.nav-links \{ display: none;/)) {
    fail(`${file} still hides entire nav-links on mobile without shell menu`)
  }
}

const terms = fs.readFileSync(path.join(ROOT, 'terms.html'), 'utf8')
if (terms.includes('href="#"')) {
  fail('terms.html must not use href="#" placeholder links')
}
if (!terms.includes('footer-text-btn') || !terms.includes('nav-text-btn')) {
  fail('terms.html missing modal trigger buttons')
}

if (failed) process.exit(1)
console.log('validate-legal-shell: PASS')
