#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { DEVELOPER_CREDIT_PLAIN, SEMPROG_DEVELOPER_URL } = require('./developer-credit')

const ROOT = path.join(__dirname, '..')
let failed = false

function fail(msg) {
  console.error(`validate-semprog-developer-link: ${msg}`)
  failed = true
}

function checkFile(rel) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) return
  const html = fs.readFileSync(abs, 'utf8')
  if (!html.includes('Developed by')) return
  if (html.includes(DEVELOPER_CREDIT_PLAIN)) {
    fail(`${rel} still has plain "${DEVELOPER_CREDIT_PLAIN}"`)
    return
  }
  const linkRe = new RegExp(
    `Developed by <a href="${SEMPROG_DEVELOPER_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" target="_blank" rel="noopener noreferrer">SEMPROG</a>`
  )
  if (!linkRe.test(html)) {
    fail(`${rel} missing expected SEMPROG developer link markup`)
  }
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
staticPages.forEach(checkFile)

const blogRoot = path.join(ROOT, 'blog')
let articleChecks = 0
for (const entry of fs.readdirSync(blogRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const rel = path.join('blog', entry.name, 'index.html')
  if (!fs.existsSync(path.join(ROOT, rel))) continue
  articleChecks++
  checkFile(rel)
}
checkFile(path.join('blog', 'index.html'))

if (failed) process.exit(1)
console.log(`validate-semprog-developer-link: PASS (static + ${articleChecks} articles)`)
