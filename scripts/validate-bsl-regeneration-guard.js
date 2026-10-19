#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const {
  assertProposalBundleComplete,
  applyCmsProposalsToArticleHtml,
  getManagedSlugs,
  loadManifest,
} = require('./cms-proposals/cms-proposal-engine')

const ROOT = path.join(__dirname, '..')
let failed = false

function fail(msg) {
  console.error(`validate-bsl-regeneration-guard: ${msg}`)
  failed = true
}

function articlePath(slug) {
  return path.join(ROOT, 'blog', slug, 'index.html')
}

function readArticle(slug) {
  const p = articlePath(slug)
  if (!fs.existsSync(p)) {
    fail(`missing article file blog/${slug}/index.html`)
    return ''
  }
  return fs.readFileSync(p, 'utf8')
}

function simulateCmsOverwrite(html, slug) {
  const manifest = loadManifest()
  const marker = manifest.safetyBlockInsert.markerId
  let out = html
  const safetyRe = new RegExp(
    `<hr>\\s*<h2 id="${marker}"[\\s\\S]*?<p>Bei <strong>Gebrauchtkäufen</strong>[\\s\\S]*?</p>`,
    'i',
  )
  out = out.replace(safetyRe, '')
  if (manifest.fullBodyReplace[slug]) {
    const re = /(<h1\s+itemprop="headline">[\s\S]*?<\/h1>\s*)([\s\S]*?)(\s*<aside class="product-soft-cta")/i
    out = out.replace(
      re,
      `$1<p><strong>Simulated stale CMS body</strong> — missing BSL guidance.</p>\n    $3`,
    )
  }
  return out
}

function assertPostApplyChecks(slug, html) {
  const manifest = loadManifest()
  const marker = manifest.safetyBlockInsert.markerId
  const body = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>([\s\S]*?)<aside class="product-soft-cta"/i) || [])[1] || ''
  const count = (body.match(new RegExp(`id="${marker}"`, 'g')) || []).length
  if (count !== 1) fail(`${slug}: after re-apply expected 1 safety block, found ${count}`)
  if (!body.includes('/blog/z-wert-kalkulator/')) fail(`${slug}: missing Z-Wert link after re-apply`)
  if (slug === 'skischuhe-236-mm' && !/Wo findest du die BSL/i.test(body)) {
    fail('236-mm: full replace not restored after simulated regen')
  }
}

try {
  assertProposalBundleComplete()
} catch (e) {
  fail(e.message)
}

const slugs = getManagedSlugs()
for (const slug of slugs) {
  const current = readArticle(slug)
  if (!current) continue
  let simulated
  try {
    simulated = simulateCmsOverwrite(current, slug)
    const restored = applyCmsProposalsToArticleHtml(slug, simulated)
    assertPostApplyChecks(slug, restored)
  } catch (e) {
    fail(`${slug}: ${e.message}`)
  }
}

const missingSlug = 'skischuhe-236-mm'
if (!fs.existsSync(path.join(__dirname, 'cms-proposals', 'skischuhe-236-mm.body.html'))) {
  fail('required proposal skischuhe-236-mm.body.html missing')
}

if (failed) process.exit(1)
console.log(`validate-bsl-regeneration-guard: PASS (${slugs.length} slugs simulated regen + re-apply)`)
