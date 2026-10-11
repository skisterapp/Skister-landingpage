#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { faviconAssetVersion } = require('./brand-tokens')

const ROOT = path.join(__dirname, '..')
const V = faviconAssetVersion
const SKIP = new Set(['.git', 'node_modules', 'branding', 'memory-bank'])

const STANDARD = [
  `<link rel="icon" href="/favicon.ico?v=${V}" sizes="any">`,
  `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${V}">`,
  `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${V}">`,
  `<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${V}">`,
  `<link rel="manifest" href="/site.webmanifest?v=${V}">`,
].join('\n')

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function bumpBlogIconHrefs(text) {
  let next = text
  next = next.replace(/href="([^"]*assets\/favicon\.png)(\?v=[^"]*)?"/g, `href="$1?v=${V}"`)
  next = next.replace(/href="([^"]*apple-touch-icon\.png)(\?v=[^"]*)?"/g, (m, base) => {
    if (base.includes('assets/favicon.png')) return m
    return `href="${base}?v=${V}"`
  })
  return next
}

function replaceAdminIconBlock(text) {
  const blockRe =
    /[ \t]*<link rel="icon"[^>]*>\s*\n(?:[ \t]*<link rel="icon"[^>]*>\s*\n)*[ \t]*<link rel="apple-touch-icon"[^>]*>\s*\n?/g
  if (!blockRe.test(text)) return text
  blockRe.lastIndex = 0
  const indent = text.includes('    <link rel="icon"') ? '    ' : '  '
  const block = STANDARD.split('\n').map((line) => indent + line.trim()).join('\n') + '\n'
  return text.replace(blockRe, block)
}

let changed = 0
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file)
  if (rel === 'index.html' || rel === '404.html') continue
  let text = fs.readFileSync(file, 'utf8')
  const orig = text
  if (rel.startsWith('blog/') || rel === 'blog.html' || rel === 'blog-post.html' || rel === 'blog/index.html') {
    text = bumpBlogIconHrefs(text)
  } else if (
    rel.endsWith('-admin.html') ||
    rel === 'admin.html' ||
    rel === 'privacy.html' ||
    rel === 'terms.html' ||
    rel === 'help.html' ||
    rel === 'account-deletion.html' ||
    rel === 'invite/index.html'
  ) {
    text = replaceAdminIconBlock(text)
    if (text === orig) text = bumpBlogIconHrefs(text)
  }
  if (text !== orig) {
    fs.writeFileSync(file, text)
    changed += 1
  }
}
console.log(`apply-favicon-version: updated ${changed} html file(s), v=${V}`)
