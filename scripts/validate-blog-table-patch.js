#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { BLOG_PROSE_TABLE_CSS } = require('./blog-table-normalize')
const { normalizeBlogBodyHeadingsInHtml } = require('./blog-heading-normalize')

const ROOT = path.join(__dirname, '..')
let cmsProposalDriftSlugs = new Set()
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'cms-proposals', 'manifest.json'), 'utf8'),
  )
  for (const slug of Object.keys(manifest.fullBodyReplace || {})) cmsProposalDriftSlugs.add(slug)
  for (const slug of manifest.safetyBlockInsert?.slugs || []) cmsProposalDriftSlugs.add(slug)
} catch (_) {}
const blogRoot = path.join(ROOT, 'blog')
let failed = false

function fail(msg) {
  console.error(`validate-blog-table-patch: ${msg}`)
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

function extractArticleBodyContent(html) {
  const match = html.match(
    /<article class="prose"[^>]*>[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>([\s\S]*?)<div class="post-more-section"/i,
  )
  return match ? match[1] : ''
}

function extractPageTitle(html) {
  const h1 = html.match(/<h1\s+itemprop="headline">([\s\S]*?)<\/h1>/i)
  if (h1) return h1[1].replace(/<[^>]+>/g, '').trim()
  const t = html.match(/<title>([\s\S]*?)<\/title>/i)
  return t ? t[1].replace(/&amp;/g, '&').trim() : ''
}

function normalizeArticleText(html) {
  let body = extractArticleBodyContent(html)
  body = normalizeBlogBodyHeadingsInHtml(body, extractPageTitle(html))
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s(data-start|data-end|data-col-size|data-section-id)="[^"]*"/gi, '')
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/<div class="blog-table-scroll"[^>]*>/gi, '<div>')
    .replace(/<div class="TyagGW_tableContainer"[^>]*>/gi, '<div>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractArticleLinks(html) {
  const body = extractArticleBodyContent(html)
  const links = []
  const re = /\shref=["']([^"']+)["']/gi
  let m
  while ((m = re.exec(body))) links.push(m[1])
  return [...new Set(links)].sort()
}

const cssSnippet = BLOG_PROSE_TABLE_CSS.trim()
const gitFiles = execSync('git diff --name-only -- blog/**/index.html', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)
const articleRels = listArticleIndexFiles().map((f) =>
  path.relative(ROOT, f).replace(/\\/g, '/'),
)
const filesToValidate = gitFiles.length > 0 ? gitFiles : articleRels
const compareWorkingTreeToHead = gitFiles.length > 0

if (filesToValidate.length !== 129) {
  fail(`expected 129 blog articles, got ${filesToValidate.length}`)
}

for (const rel of filesToValidate) {
  const filePath = path.join(ROOT, rel)
  const html = fs.readFileSync(filePath, 'utf8')
  const proseCssCount = (html.match(/\.prose \{ max-width: 100%; min-width: 0; \}/g) || []).length
  if (proseCssCount !== 1) fail(`${rel}: expected 1 table CSS block, found ${proseCssCount}`)
  if (!html.includes('blog-table-scroll') && !html.includes('.prose .TyagGW_tableContainer')) {
    fail(`${rel}: missing table scroll styles`)
  }
  if (html.includes('w-fit min-w-(--thread-content-width)')) {
    fail(`${rel}: pasted table utility classes remain in body`)
  }
  if (!compareWorkingTreeToHead) continue
  let headVersion = ''
  try {
    headVersion = execSync(`git show HEAD:${rel}`, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  } catch (_) {
    continue
  }
  if (/application\/ld\+json/.test(headVersion)) {
    const stripLdDescriptions = (jsonText) => {
      try {
        const data = JSON.parse(jsonText)
        const graph = data['@graph'] || [data]
        for (const node of graph) {
          if (node && (node['@type'] === 'BlogPosting' || node['@type'] === 'Article')) {
            delete node.description
          }
        }
        return JSON.stringify(data)
      } catch {
        return jsonText
      }
    }
    const oldLd = headVersion.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    const newLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (oldLd && newLd && stripLdDescriptions(oldLd[1]) !== stripLdDescriptions(newLd[1])) {
      fail(`${rel}: JSON-LD changed (excluding description)`)
    }
  }
  const oldCanon = (headVersion.match(/<link rel="canonical" href="([^"]+)"/) || [])[1]
  const newCanon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1]
  if (oldCanon && newCanon && oldCanon !== newCanon) fail(`${rel}: canonical changed`)

  const slug = path.basename(path.dirname(filePath))
  if (!cmsProposalDriftSlugs.has(slug)) {
    const oldText = normalizeArticleText(headVersion)
    const newText = normalizeArticleText(html)
    if (oldText !== newText) fail(`${rel}: article visible text changed`)

    const oldLinks = extractArticleLinks(headVersion)
    const newLinks = extractArticleLinks(html)
    if (oldLinks.join('|') !== newLinks.join('|')) fail(`${rel}: article links changed`)
  }
}

if (failed) process.exit(1)
console.log(`validate-blog-table-patch: PASS (${filesToValidate.length} articles)`)
