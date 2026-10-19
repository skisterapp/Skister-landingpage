#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { loadBlogSeoOverrides, resolvePostSeoMeta } = require('./blog-meta-refine')

const blogRoot = path.join(__dirname, '..', 'blog')
let patched = 0

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name)
    if (name.isDirectory()) walk(full)
    else if (name.name === 'index.html') patchFile(full)
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function extractArticleBody(html) {
  const m = html.match(
    /<article class="prose"[^>]*>[\s\S]*?<h1\s+itemprop="headline">[\s\S]*?<\/h1>([\s\S]*?)<div class="post-more-section"/i,
  )
  return m ? m[1] : ''
}

function applyMetaToHtml(html, { metaTitle, metaDescription }) {
  const escTitle = escapeHtml(metaTitle)
  const escDesc = escapeHtml(metaDescription)
  let out = html
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escTitle}</title>`)
  out = out.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']/i,
    `<meta name="description" content="${escDesc}"`,
  )
  out = out.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']/gi,
    `<meta name="twitter:title" content="${escTitle}"`,
  )
  out = out.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']/gi,
    `<meta name="twitter:description" content="${escDesc}"`,
  )
  out = out.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']/gi,
    `<meta property="og:title" content="${escTitle}"`,
  )
  out = out.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']/gi,
    `<meta property="og:description" content="${escDesc}"`,
  )
  out = out.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, (match, jsonText) => {
    try {
      const data = JSON.parse(jsonText)
      const graph = data['@graph'] || [data]
      for (const node of graph) {
        if (node && (node['@type'] === 'BlogPosting' || node['@type'] === 'Article')) {
          node.description = metaDescription
          if (metaTitle) node.headline = metaTitle
        }
      }
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
    } catch {
      return match
    }
  })
  return out
}

function patchFile(filePath) {
  if (filePath.endsWith(`${path.sep}blog${path.sep}index.html`)) return
  const html = fs.readFileSync(filePath, 'utf8')
  const slug = path.basename(path.dirname(filePath))
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i)
  const descM = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
  const title = titleM ? titleM[1].replace(/&amp;/g, '&').trim() : ''
  const description = descM ? descM[1].replace(/&quot;/g, '"').trim() : ''
  const bodyHtml = extractArticleBody(html)
  const overrides = loadBlogSeoOverrides()
  const shouldPatch =
    Boolean(overrides[slug]) || description.length > 280 || description.length < 70
  if (!shouldPatch) return
  const next = resolvePostSeoMeta({ slug, title, description, bodyHtml })
  const needsChange =
    next.metaDescription !== description ||
    (next.metaTitle && next.metaTitle !== title)
  if (!needsChange) return
  const updated = applyMetaToHtml(html, next)
  if (updated !== html) {
    fs.writeFileSync(filePath, updated, 'utf8')
    patched++
    console.log('patched meta', slug)
  }
}

walk(blogRoot)
console.log('patch-static-blog-meta: done, files patched:', patched)
