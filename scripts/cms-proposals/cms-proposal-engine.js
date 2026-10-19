#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const PROPOSALS_DIR = path.join(__dirname)
const MANIFEST_PATH = path.join(PROPOSALS_DIR, 'manifest.json')

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
}

function getManagedSlugs(manifest) {
  const m = manifest || loadManifest()
  return [
    ...Object.keys(m.fullBodyReplace || {}),
    ...(m.safetyBlockInsert?.slugs || []),
  ]
}

function assertProposalBundleComplete() {
  const manifest = loadManifest()
  const missing = []
  for (const rel of Object.values(manifest.fullBodyReplace || {})) {
    const p = path.join(PROPOSALS_DIR, rel)
    if (!fs.existsSync(p)) missing.push(rel)
  }
  const safetyFile = manifest.safetyBlockInsert?.file
  if (!safetyFile) missing.push('safetyBlockInsert.file')
  else if (!fs.existsSync(path.join(PROPOSALS_DIR, safetyFile))) missing.push(safetyFile)
  if (missing.length) {
    throw new Error(`cms-proposals incomplete: missing ${missing.join(', ')}`)
  }
  return manifest
}

function readSafetyBlock(manifest) {
  const file = manifest.safetyBlockInsert.file
  return fs.readFileSync(path.join(PROPOSALS_DIR, file), 'utf8').trim()
}

function readFullBodyProposal(slug, manifest) {
  const rel = manifest.fullBodyReplace[slug]
  if (!rel) return null
  return fs.readFileSync(path.join(PROPOSALS_DIR, rel), 'utf8').trim()
}

function stripExistingSafety(bodyHtml, marker) {
  const re = new RegExp(
    `<hr>\\s*<h2 id="${marker}"[\\s\\S]*?</h2>\\s*<p>Bitte trenne drei Dinge:[\\s\\S]*?</p>\\s*<ul>[\\s\\S]*?</ul>\\s*<p>Der <a href="/blog/z-wert-kalkulator/">[\\s\\S]*?</p>\\s*<p>Bei <strong>Gebrauchtkäufen</strong>[\\s\\S]*?</p>`,
    'i',
  )
  return bodyHtml.replace(re, '').trim()
}

function fazitHeadingRe() {
  return /<hr>\s*<h2[^>]*>[\s\S]*?Fazit[\s\S]*?<\/h2>/i
}

function insertSafetyBeforeFazit(bodyHtml, safetyBlock, marker) {
  let body = stripExistingSafety(bodyHtml, marker)
  if (body.includes(`id="${marker}"`)) return body
  const fazitRe = fazitHeadingRe()
  if (fazitRe.test(body)) {
    return body.replace(fazitRe, (match) => `${safetyBlock}\n${match}`)
  }
  const fazitOnly = /<h2[^>]*>[\s\S]*?Fazit[\s\S]*?<\/h2>/i
  if (fazitOnly.test(body)) {
    return body.replace(fazitOnly, (match) => `${safetyBlock}\n${match}`)
  }
  return `${body.trim()}\n${safetyBlock}`
}

function patchArticleBodyRegion(slug, html, bodyInner) {
  const re = /(<h1\s+itemprop="headline">[\s\S]*?<\/h1>\s*)([\s\S]*?)(\s*<aside class="product-soft-cta")/i
  const m = html.match(re)
  if (!m) throw new Error(`cms-proposals: body region not found for ${slug}`)
  const featured = (m[2].match(/<figure class="prose-featured">[\s\S]*?<\/figure>/i) || [])[0]
  const prefix = m[1] + (featured ? `${featured}\n    ` : '')
  return html.replace(re, `${prefix}${bodyInner.trim()}\n    $3`)
}

function extractBodyRegion(html) {
  const re = /(<h1\s+itemprop="headline">[\s\S]*?<\/h1>\s*)([\s\S]*?)(\s*<aside class="product-soft-cta")/i
  const m = html.match(re)
  if (!m) return null
  return { prefix: m[1], body: m[2], suffix: m[3] }
}

function applyCmsProposalsToArticleHtml(slug, html) {
  const manifest = loadManifest()
  const marker = manifest.safetyBlockInsert.markerId
  const safetyBlock = readSafetyBlock(manifest)
  const fullReplace = readFullBodyProposal(slug, manifest)
  if (fullReplace) {
    return patchArticleBodyRegion(slug, html, fullReplace)
  }
  if (!(manifest.safetyBlockInsert.slugs || []).includes(slug)) {
    return html
  }
  const region = extractBodyRegion(html)
  if (!region) throw new Error(`cms-proposals: cannot insert safety for ${slug}`)
  let body = region.body
  const featured = (body.match(/<figure class="prose-featured">[\s\S]*?<\/figure>/i) || [])[0]
  body = body.replace(/<figure class="prose-featured">[\s\S]*?<\/figure>\s*/i, '')
  const updated = insertSafetyBeforeFazit(body, safetyBlock, marker)
  const bodyInner = (featured ? `${featured}\n    ` : '') + updated.trim()
  return patchArticleBodyRegion(slug, html, bodyInner)
}

function isManagedSlug(slug) {
  return getManagedSlugs().includes(slug)
}

module.exports = {
  loadManifest,
  getManagedSlugs,
  assertProposalBundleComplete,
  applyCmsProposalsToArticleHtml,
  isManagedSlug,
  insertSafetyBeforeFazit,
  readSafetyBlock,
  PROPOSALS_DIR,
  MANIFEST_PATH,
}
