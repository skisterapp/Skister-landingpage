#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SITE_ORIGIN = 'https://skister.app'
const blogRoot = path.join(ROOT, 'blog')
let failed = false

function fail(msg) {
  console.error(`validate-blog-article-seo: ${msg}`)
  failed = true
}

function listArticleIndexFiles() {
  const out = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'index.html' && full !== path.join(blogRoot, 'index.html')) out.push(full)
    }
  }
  walk(blogRoot)
  return out
}

function extractArticleProse(html) {
  const m = html.match(/<article class="prose"[^>]*>([\s\S]*?)<\/article>/i)
  return m ? m[1] : ''
}

const files = listArticleIndexFiles()
const titles = new Map()

for (const filePath of files) {
  const rel = path.relative(ROOT, filePath)
  const html = fs.readFileSync(filePath, 'utf8')
  const prose = extractArticleProse(html)
  const h1Count = (prose.match(/<h1\b/gi) || []).length
  if (h1Count !== 1) fail(`${rel}: expected 1 <h1> in article, found ${h1Count}`)

  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i)
  const title = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : ''
  if (!title) fail(`${rel}: missing <title>`)
  if (titles.has(title)) fail(`Duplicate <title> "${title}" in ${rel} and ${titles.get(title)}`)
  else titles.set(title, rel)

  const descM = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
  const desc = descM ? descM[1].trim() : ''
  if (!desc) fail(`${rel}: missing meta description`)

  const canonM = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
  const canonical = canonM ? canonM[1].trim() : ''
  if (!canonical.startsWith(`${SITE_ORIGIN}/blog/`)) fail(`${rel}: canonical must be under ${SITE_ORIGIN}/blog/`)
  if (!canonical.endsWith('/')) fail(`${rel}: canonical must end with /`)
  const slug = path.basename(path.dirname(filePath))
  const expected = `${SITE_ORIGIN}/blog/${encodeURIComponent(slug)}/`
  if (canonical !== expected) fail(`${rel}: canonical ${canonical} !== ${expected}`)
}

if (failed) process.exit(1)
console.log(`validate-blog-article-seo: PASS (${files.length} articles)`)
