#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { renderDocumentHtml, getUpdatedLine } = require('./legal-html-render')

const ROOT = path.join(__dirname, '..')
const JSON_PATH = path.join(__dirname, 'legal-content.json')

function patchLegalPage(fileName, type) {
  const filePath = path.join(ROOT, fileName)
  let html = fs.readFileSync(filePath, 'utf8')
  const content = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
  const updated = getUpdatedLine(content, type, 'de')
  const body = renderDocumentHtml(content, type, 'de')
  if (!body) {
    throw new Error(`prerender-legal-pages: no German content for ${type}`)
  }

  html = html.replace(
    /<p id="legal-page-updated" class="legal-updated">\s*<\/p>/,
    `<p id="legal-page-updated" class="legal-updated">${updated}</p>`,
  )
  html = html.replace(
    /<div id="legal-page-content" aria-live="polite">\s*<\/div>/,
    `<div id="legal-page-content" aria-live="polite">\n${body}\n    </div>`,
  )

  if (!html.includes('legal-section')) {
    throw new Error(`prerender-legal-pages: failed to embed ${fileName}`)
  }

  fs.writeFileSync(filePath, html, 'utf8')
  console.log(`prerender-legal-pages: embedded DE ${type} in ${fileName}`)
}

function main() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('prerender-legal-pages: run sync:legal first (missing legal-content.json)')
    process.exit(1)
  }
  patchLegalPage('privacy.html', 'privacy')
  patchLegalPage('terms.html', 'terms')
}

main()
