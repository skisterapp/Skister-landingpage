#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const { renderDocumentHtml, getUpdatedLine } = require('./legal-html-render')
let failed = false

function fail(msg) {
  console.error(`validate-legal-pages: ${msg}`)
  failed = true
}

for (const file of ['privacy.html', 'terms.html']) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8')
  if (!html.includes('<section class="legal-section')) {
    fail(`${file} missing prerendered legal sections (run npm run prerender:legal)`)
  }
  if (html.match(/id="legal-page-updated"[^>]*>\s*<\/p>/)) {
    fail(`${file} legal-page-updated is empty`)
  }
  if (!html.includes('meta name="description"')) {
    fail(`${file} missing meta description`)
  }
}

const jsonPath = path.join(__dirname, 'legal-content.json')
if (fs.existsSync(jsonPath)) {
  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  for (const [file, type] of [['privacy.html', 'privacy'], ['terms.html', 'terms']]) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8')
    const expected = renderDocumentHtml(content, type, 'de')
    const updated = getUpdatedLine(content, type, 'de')
    const match = html.match(/<div id="legal-page-content"[^>]*>([\s\S]*?)<\/div>/)
    const embedded = match ? match[1].trim() : ''
    if (embedded !== expected.trim()) {
      fail(`${file} prerender out of sync with legal-content.json (run npm run prerender:legal)`)
    }
    if (!html.includes(updated)) {
      fail(`${file} legal-page-updated does not match legal-content.json`)
    }
  }
} else {
  fail('missing scripts/legal-content.json (run npm run sync:legal)')
}

const site = JSON.parse(fs.readFileSync(path.join(__dirname, 'legal-site.json'), 'utf8'))
const impressumPath = path.join(ROOT, 'impressum.html')

if (site.impressumPublished) {
  if (!fs.existsSync(impressumPath)) {
    fail('impressumPublished is true but impressum.html is missing')
  } else {
    const impressum = fs.readFileSync(impressumPath, 'utf8')
    const draftMarkers = [
      'Noch nicht veröffentlicht',
      'Noch zu bestätigen (keine Angaben erfunden)',
      'class="legal-section draft-notice"',
      'Impressum (Entwurf)',
    ]
    for (const marker of draftMarkers) {
      if (impressum.includes(marker)) {
        fail(`impressumPublished is true but draft marker still present: ${marker}`)
      }
    }
    if (!/data-impressum-provider-complete=["']true["']/i.test(impressum)) {
      fail(
        'impressumPublished is true but impressum.html missing data-impressum-provider-complete="true" (fill provider details first)',
      )
    }
    const robots = (impressum.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i) || [])[1] || ''
    if (/noindex/i.test(robots)) {
      fail('impressumPublished is true but impressum.html still has robots noindex')
    }
    const op = site.operator || {}
    for (const [key, value] of Object.entries(op)) {
      if (!value || typeof value !== 'string') continue
      if (!impressum.includes(value)) {
        fail(`impressum.html missing operator.${key}: ${value}`)
      }
    }
    const sitemapPath = path.join(ROOT, 'sitemap.xml')
    const robotsPath = path.join(ROOT, 'robots.txt')
    const indexPath = path.join(ROOT, 'index.html')
    if (fs.existsSync(sitemapPath)) {
      const sitemap = fs.readFileSync(sitemapPath, 'utf8')
      if (!sitemap.includes('/impressum.html')) {
        fail('impressumPublished is true but sitemap.xml missing /impressum.html')
      }
    }
    if (fs.existsSync(robotsPath)) {
      const robotsTxt = fs.readFileSync(robotsPath, 'utf8')
      if (/Disallow:\s*\/impressum\.html/i.test(robotsTxt)) {
        fail('impressumPublished is true but robots.txt still disallows /impressum.html')
      }
    }
    if (fs.existsSync(indexPath)) {
      const indexHtml = fs.readFileSync(indexPath, 'utf8')
      if (!indexHtml.includes('href="/impressum.html"')) {
        fail('impressumPublished is true but index.html missing Impressum footer link')
      }
    }
  }
} else if (fs.existsSync(impressumPath)) {
  const impressum = fs.readFileSync(impressumPath, 'utf8')
  if (!impressum.includes('noindex')) {
    fail('impressum.html must include noindex while unpublished')
  }
}

if (failed) process.exit(1)
console.log('validate-legal-pages: PASS')
