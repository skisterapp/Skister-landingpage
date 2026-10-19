#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const {
  normalizeBlogTablesInHtml,
  replaceLegacyTableCssInArticleStyle,
} = require('./blog-table-normalize')

const blogRoot = path.join(__dirname, '..', 'blog')
let patched = 0

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (name.name === 'index.html') patchFile(full)
  }
}

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8')
  if (!html.includes('TyagGW_tableContainer') && !html.includes('blog-table-scroll')) return
  if (!html.includes('<article class="prose"')) return
  const before = html
  html = html.replace(/<style>([\s\S]*?)<\/style>/, (match, styleInner) => {
    const next = replaceLegacyTableCssInArticleStyle(styleInner)
    return `<style>${next}</style>`
  })
  html = html.replace(
    /(<article class="prose"[^>]*>)([\s\S]*?)(<\/article>)/,
    (full, open, body, close) => open + normalizeBlogTablesInHtml(body) + close,
  )
  if (html !== before) {
    fs.writeFileSync(filePath, html, 'utf8')
    patched++
    console.log('patched', path.relative(blogRoot, filePath))
  }
}

walk(blogRoot)
console.log('patch-static-blog-tables: done, files patched:', patched)
