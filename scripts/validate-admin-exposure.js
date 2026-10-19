#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const ADMIN_PAGES = [
  'admin.html',
  'blog-admin.html',
  'landing-admin.html',
  'seo-admin.html',
  'resort-admin.html',
]

let failed = false

for (const file of ADMIN_PAGES) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8')
  if (!/name="robots"\s+content="noindex,\s*nofollow"/i.test(html)) {
    console.error(`validate-admin-exposure: ${file} missing noindex,nofollow robots meta`)
    failed = true
  }
}

const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8')
for (const file of ADMIN_PAGES) {
  const rule = `Disallow: /${file}`
  if (!robots.includes(rule)) {
    console.error(`validate-admin-exposure: robots.txt missing ${rule}`)
    failed = true
  }
}

const genBlogs = fs.readFileSync(path.join(ROOT, 'scripts/generateBlogs.js'), 'utf8')
if (genBlogs.indexOf('mergeAdminRobotsDisallows') === -1) {
  console.error('validate-admin-exposure: generateBlogs.js missing mergeAdminRobotsDisallows')
  failed = true
}

const seoInject = fs.readFileSync(path.join(ROOT, 'scripts/seo-inject.js'), 'utf8')
if (seoInject.indexOf('hasBuiltInSiteMeta') === -1) {
  console.error('validate-admin-exposure: seo-inject.js missing hasBuiltInSiteMeta guard')
  failed = true
}

if (failed) process.exit(1)
console.log('validate-admin-exposure: PASS')
