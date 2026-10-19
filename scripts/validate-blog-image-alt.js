#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { loadBlogImageAltOverrides } = require('./blog-image-alt')

const ROOT = path.join(__dirname, '..')
const blogRoot = path.join(ROOT, 'blog')
const overrides = loadBlogImageAltOverrides()
let failed = false

function fail(msg) {
  console.error(`validate-blog-image-alt: ${msg}`)
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

function extractArticleBody(html) {
  const m = html.match(
    /<article class="prose"[^>]*>[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>([\s\S]*?)<div class="post-more-section"/i,
  )
  return m ? m[1] : ''
}

function featuredBlock(html) {
  const m = html.match(/<figure class="prose-featured">[\s\S]*?<\/figure>/i)
  return m ? m[0] : ''
}

for (const filePath of listArticleIndexFiles()) {
  const rel = path.relative(ROOT, filePath)
  const html = fs.readFileSync(filePath, 'utf8')
  const blocks = [extractArticleBody(html), featuredBlock(html)].filter(Boolean).join('\n')
  const imgs = [...blocks.matchAll(/<img\b[^>]*>/gi)]
  for (const tag of imgs) {
    const img = tag[0]
    if (!/\balt\s*=/i.test(img)) fail(`${rel}: img missing alt attribute`)
    else if (/\balt\s*=\s*["']\s*["']/i.test(img)) fail(`${rel}: img has empty alt`)
  }
}

const overrideCount = Object.keys(overrides).length
if (overrideCount < 5) fail(`expected at least 5 image alt overrides, found ${overrideCount}`)

if (failed) process.exit(1)
console.log(`validate-blog-image-alt: PASS (${listArticleIndexFiles().length} articles)`)
