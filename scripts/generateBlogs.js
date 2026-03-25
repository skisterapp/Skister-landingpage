#!/usr/bin/env node
/**
 * Static blog generator for Skister (SeaDays-style).
 * Fetches posts with forWebsite=1, merges site SEO + per-post SEO overrides,
 * writes blog/{slug}/index.html, blog/{slug}.html redirects, blog/index.html, sitemap.xml.
 *
 * Usage: SUPABASE_ANON_KEY=... node scripts/generateBlogs.js
 * Optional: SKISTER_SITE_URL=https://skister.app
 */
'use strict'

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SKISTER_SUPABASE_URL || 'https://ayomhapkzckbhgwxenwr.supabase.co'
const ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
const EDGE = `${SUPABASE_URL}/functions/v1/make-server-080ebf84`
const SITE_URL = (process.env.SKISTER_SITE_URL || 'https://skister.app').replace(/\/$/, '')
const OUT = path.join(__dirname, '..')

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      ...init.headers,
    },
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 120)}`)
  }
  if (!res.ok) {
    throw new Error(data.error || `${res.status} ${url}`)
  }
  return data
}

function articleJsonLd(p, imageUrl) {
  const o = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title || '',
    datePublished: p.publishedTime || undefined,
    author: { '@type': 'Organization', name: p.author || 'Skister' },
  }
  if (imageUrl) o.image = imageUrl
  return JSON.stringify(o)
}

function buildArticlePage({
  title,
  description,
  canonical,
  robots,
  ogImage,
  siteName,
  author,
  publishedTime,
  maxImagePreview,
  bodyHtml,
  slug,
}) {
  const mi = maxImagePreview || 'large'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta name="googlebot" content="max-image-preview:${escapeHtml(mi)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}">` : ''}
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="article:author" content="${escapeHtml(author)}">
  ${publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}">` : ''}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/png" href="../../assets/favicon.png">
  <style>
    body { font-family: system-ui, sans-serif; background:#0a0a0a; color:#fff; line-height:1.6; max-width:720px; margin:0 auto; padding:2rem 1.25rem 4rem; }
    a { color:#228B22; }
    .nav { margin-bottom:2rem; font-size:0.95rem; }
    .prose img { max-width:100%; height:auto; }
    h1 { color:#228B22; font-size:1.75rem; }
  </style>
</head>
<body>
  <nav class="nav"><a href="../../index.html">Home</a> · <a href="../../blog.html">Blog</a></nav>
  <article class="prose">
    <h1>${escapeHtml(title)}</h1>
    ${bodyHtml}
  </article>
  <script type="application/ld+json">${articleJsonLd(
    { title, author, publishedTime },
    ogImage,
  )}</script>
</body>
</html>`
}

async function main() {
  if (!ANON_KEY) {
    console.error('Set SUPABASE_ANON_KEY (Skister anon JWT).')
    process.exit(1)
  }

  const siteSeoRes = await fetchJson(`${EDGE}/site-seo`)
  const siteSeo = siteSeoRes.seo || {}
  const base = (siteSeo.canonicalBase || siteSeo.siteUrl || SITE_URL).replace(/\/$/, '')

  const listRes = await fetchJson(`${EDGE}/blog/posts?forWebsite=1`)
  const posts = listRes.posts || []

  const blogDir = path.join(OUT, 'blog')
  fs.mkdirSync(blogDir, { recursive: true })

  const sitemapUrls = [
    `${base}/`,
    `${base}/index.html`,
    `${base}/blog.html`,
  ]

  for (const summary of posts) {
    const slug = summary.slug
    if (!slug || typeof slug !== 'string') continue

    const detail = await fetchJson(`${EDGE}/blog/posts/${encodeURIComponent(slug)}`)
    const p = detail.post || summary
    if (p.showOnWebsite === false || p.archived) continue

    let seo = {}
    try {
      const seoRes = await fetchJson(`${EDGE}/blog/posts/${encodeURIComponent(slug)}/seo`)
      seo = seoRes.seo || {}
    } catch {
      seo = {}
    }

    const canonical = (
      seo.canonicalUrl && String(seo.canonicalUrl).trim()
    ) || `${base}/blog/${encodeURIComponent(slug)}/`

    const title = seo.metaTitle || p.metaTitle || p.title || slug
    const description =
      seo.metaDescription ||
      p.metaDescription ||
      stripHtml(p.content).slice(0, 160) ||
      title
    const ogImage = String(seo.ogImage || p.featuredImage || siteSeo.ogImage || '').trim()
    const author = seo.articleAuthor || p.author || siteSeo.articleAuthor || 'Skister'
    const publishedTime = seo.articlePublishedTime || p.publishedTime || ''
    const robots = seo.robots || p.robots || siteSeo.robots || 'index,follow'
    const maxImagePreview = seo.maxImagePreview || p.maxImagePreview || siteSeo.maxImagePreview || 'large'
    const siteName = p.ogSiteName || siteSeo.ogSiteName || 'Skister'

    const slugDir = path.join(blogDir, slug)
    fs.mkdirSync(slugDir, { recursive: true })

    const page = buildArticlePage({
      title,
      description,
      canonical,
      robots,
      ogImage,
      siteName,
      author,
      publishedTime,
      maxImagePreview,
      bodyHtml: String(p.content || ''),
      slug,
    })
    fs.writeFileSync(path.join(slugDir, 'index.html'), page, 'utf8')

    const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonical)}">
  <title>Redirect</title>
</head>
<body><p><a href="${escapeHtml(canonical)}">Continue to article</a></p></body>
</html>`
    fs.writeFileSync(path.join(blogDir, `${slug}.html`), redirectHtml, 'utf8')

    sitemapUrls.push(canonical.endsWith('/') ? canonical.slice(0, -1) : canonical)
  }

  const indexLinks = posts
    .filter((p) => p && p.slug && p.showOnWebsite !== false && !p.archived)
    .map((p) => {
      const u = `${base}/blog/${encodeURIComponent(p.slug)}/`
      return `<li><a href="${escapeHtml(u)}">${escapeHtml(p.title || p.slug)}</a></li>`
    })
    .join('\n')

  const blogIndex = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog — Skister</title>
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${escapeHtml(`${base}/blog/`)}">
  <link rel="icon" type="image/png" href="../assets/favicon.png">
  <style>
    body { font-family: system-ui, sans-serif; background:#0a0a0a; color:#fff; padding:2rem; max-width:640px; margin:0 auto; }
    a { color:#228B22; }
  </style>
</head>
<body>
  <p><a href="../index.html">Home</a> · <a href="../blog.html">Dynamic blog</a></p>
  <h1>Skister blog (static)</h1>
  <ul>
${indexLinks}
  </ul>
</body>
</html>`
  fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndex, 'utf8')
  sitemapUrls.push(`${base}/blog/`)

  const today = new Date().toISOString().split('T')[0]
  const urlset = sitemapUrls
    .filter(Boolean)
    .map((loc) => `  <url><loc>${escapeHtml(loc)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>
`
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8')
  console.log('Wrote blog/*, sitemap.xml — posts:', posts.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
