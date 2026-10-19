#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { articleHasCorrectCommentButtonCss } = require('./blog-comment-button-normalize')

const blogRoot = path.join(__dirname, '..', 'blog')
let failed = false
let withButton = 0

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (name.name === 'index.html' && full !== path.join(blogRoot, 'index.html')) {
      const html = fs.readFileSync(full, 'utf8')
      if (!html.includes('btn-submit')) continue
      withButton++
      if (!articleHasCorrectCommentButtonCss(html)) {
        failed = true
        console.error(
          `validate-blog-comment-button-patch: ${path.relative(blogRoot, full)}`,
        )
      }
    }
  }
}

walk(blogRoot)

if (failed) process.exit(1)
console.log(
  `validate-blog-comment-button-patch: PASS (${withButton} articles with comment button)`,
)
