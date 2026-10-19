#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const {
  DEVELOPER_CREDIT_PLAIN,
  DEVELOPER_CREDIT_HTML,
  SEMPROG_DEVELOPER_URL,
} = require('./developer-credit')

const ROOT = path.join(__dirname, '..')
const MARKER = `href="${SEMPROG_DEVELOPER_URL}"`

function patchHtml(html) {
  if (!html.includes(DEVELOPER_CREDIT_PLAIN)) return null
  if (html.includes(MARKER) && html.includes('Developed by <a')) return null
  return html.split(DEVELOPER_CREDIT_PLAIN).join(DEVELOPER_CREDIT_HTML)
}

function patchFile(relPath) {
  const abs = path.join(ROOT, relPath)
  if (!fs.existsSync(abs)) return false
  const html = fs.readFileSync(abs, 'utf8')
  const next = patchHtml(html)
  if (!next) return false
  fs.writeFileSync(abs, next, 'utf8')
  return true
}

function walkBlogArticles() {
  let count = 0
  const blogRoot = path.join(ROOT, 'blog')
  for (const entry of fs.readdirSync(blogRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const rel = path.join('blog', entry.name, 'index.html')
    if (patchFile(rel)) count++
  }
  if (patchFile(path.join('blog', 'index.html'))) count++
  return count
}

const staticPages = [
  'index.html',
  'terms.html',
  'privacy.html',
  'help.html',
  'blog.html',
  'blog-post.html',
  '404.html',
]

let staticCount = 0
staticPages.forEach((rel) => {
  if (patchFile(rel)) staticCount++
})

const articleCount = walkBlogArticles()
console.log(`patch-semprog-developer-link: static=${staticCount} articles=${articleCount}`)
