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
const manifest = assertProposalBundleComplete()
let ops = 0

for (const slug of getManagedSlugs(manifest)) {
  const filePath = path.join(ROOT, 'blog', slug, 'index.html')
  const html = fs.readFileSync(filePath, 'utf8')
  const next = applyCmsProposalsToArticleHtml(slug, html)
  if (next !== html) {
    fs.writeFileSync(filePath, next, 'utf8')
    ops++
    console.log('patched', slug)
  } else {
    console.log('unchanged', slug)
  }
}

console.log('apply-cms-proposals-local: done, operations:', ops)
