#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { normalizeBlogBodyHeadingsInHtml } = require('./blog-heading-normalize')

const blogRoot = path.join(__dirname, '..', 'blog')
let patched = 0

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (name.name === 'index.html') patchFile(full)
  }
}

function extractPageTitle(html) {
  const h1 = html.match(/<h1\s+itemprop="headline">([\s\S]*?)<\/h1>/i)
  if (h1) return h1[1].replace(/<[^>]+>/g, '').trim()
  const t = html.match(/<title>([\s\S]*?)<\/title>/i)
  return t ? t[1].trim() : ''
}

function patchFile(filePath) {
  if (filePath.endsWith(`${path.sep}blog${path.sep}index.html`)) return
  let html = fs.readFileSync(filePath, 'utf8')
  if (!html.includes('<article class="prose"')) return
  const title = extractPageTitle(html)
  const before = html
  html = html.replace(
    /(<article class="prose"[^>]*>[\s\S]*?<h1\s+itemprop="headline">[\s\S]*?<\/h1>)([\s\S]*?)(<div class="post-more-section")/i,
    (_full, prefix, body, suffix) => prefix + normalizeBlogBodyHeadingsInHtml(body, title) + suffix,
  )
  if (html !== before) {
    fs.writeFileSync(filePath, html, 'utf8')
    patched++
    console.log('patched', path.relative(blogRoot, filePath))
  }
}

walk(blogRoot)
console.log('patch-static-blog-headings: done, files patched:', patched)
