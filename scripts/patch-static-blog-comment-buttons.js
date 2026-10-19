#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { patchCommentButtonsInArticleHtml } = require('./blog-comment-button-normalize')

const blogRoot = path.join(__dirname, '..', 'blog')
let patched = 0
let scanned = 0

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (name.name === 'index.html' && full !== path.join(blogRoot, 'index.html')) {
      patchFile(full)
    }
  }
}

function patchFile(filePath) {
  const before = fs.readFileSync(filePath, 'utf8')
  if (!before.includes('btn-submit')) return
  scanned++
  const after = patchCommentButtonsInArticleHtml(before)
  if (after !== before) {
    fs.writeFileSync(filePath, after, 'utf8')
    patched++
  }
}

walk(blogRoot)
console.log(
  `patch-static-blog-comment-buttons: scanned=${scanned} patched=${patched}`,
)
