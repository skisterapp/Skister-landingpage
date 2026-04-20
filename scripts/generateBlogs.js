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
const BLOG_IMAGES_PUBLIC_BASE =
  `${SUPABASE_URL}/storage/v1/object/public/make-080ebf84-blog-images`

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

function toArrayFromSlugs(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map((s) => String(s || '').trim()).filter(Boolean)
  return String(value)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function blogRelPath(slug) {
  return `/blog/${encodeURIComponent(slug)}/`
}

function blogCanonicalUrl({ base, slug }) {
  return `${base}/blog/${encodeURIComponent(slug)}/`
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

/** When /site-seo is missing on the deployed Edge Function (404), use defaults. */
async function fetchSiteSeoSafe() {
  const url = `${EDGE}/site-seo`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ANON_KEY}` },
  })
  const text = await res.text()
  if (!res.ok) {
    console.warn(`site-seo returned ${res.status}; using generator defaults for blog index meta.`)
    return {}
  }
  try {
    const data = text ? JSON.parse(text) : {}
    return data.seo || {}
  } catch {
    console.warn('site-seo: invalid JSON; using defaults.')
    return {}
  }
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

function addLazyAttributesToBodyHtml(html) {
  if (!html || typeof html !== 'string') return ''
  // Add loading/decoding to imgs that don't already have them.
  return html.replace(/<img\b([^>]*?)>/gi, (full, attrs) => {
    const hasLoading = /\bloading\s*=/.test(attrs)
    const hasDecoding = /\bdecoding\s*=/.test(attrs)
    const nextAttrs = []
    nextAttrs.push(attrs.trim())
    if (!hasLoading) nextAttrs.push('loading="lazy"')
    if (!hasDecoding) nextAttrs.push('decoding="async"')
    return `<img ${nextAttrs.filter(Boolean).join(' ').trim()}>`
  })
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
  const hasInlineImage = typeof bodyHtml === 'string' && /<img\b/i.test(bodyHtml)
  const featuredBlock =
    ogImage && !hasInlineImage
      ? `<figure class="prose-featured"><img src="${escapeHtml(ogImage)}" alt="${escapeHtml(title)}" loading="eager" decoding="async" width="1200" height="630"></figure>`
      : ''
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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous">
  <style>
    :root { --primary-green:#228B22; --primary-green-light:#2da82d; --bg-card:#1a1a1a; --text-gray:#b0b0b0; --border-color:rgba(255,255,255,0.1); }
    body { font-family: system-ui, sans-serif; background:#0a0a0a; color:#fff; line-height:1.6; max-width:760px; margin:0 auto; padding:2rem 1.25rem 4rem; }
    a { color:#228B22; }
    .nav { margin-bottom:2rem; font-size:0.95rem; }
    .prose img { max-width:100%; height:auto; display:block; }
    .prose-featured { margin:0 0 1.5rem; }
    .prose-featured img { width:100%; height:auto; border-radius:10px; border:1px solid rgba(255,255,255,0.12); }
    .prose > h1:first-of-type { color:#228B22; font-size:1.75rem; }
    h1 { color:#228B22; font-size:1.75rem; }
    .prose .TyagGW_tableContainer { margin:1rem 0; overflow-x:auto; -webkit-overflow-scrolling:touch; max-width:100%; }
    .prose table { border-collapse:collapse; width:100%; max-width:100%; border:1px solid rgba(255,255,255,0.28); }
    .prose th, .prose td { border:1px solid rgba(255,255,255,0.28); padding:0.5rem 0.75rem; text-align:left; vertical-align:top; }
    .prose thead th { background:rgba(255,255,255,0.08); font-weight:600; }
    .prose tbody tr:nth-child(even) { background:rgba(255,255,255,0.03); }
    .post-more-section { margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid var(--border-color); }
    .post-nav-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; align-items:stretch; }
    .post-nav-row > div { min-width:0; }
    .post-nav-btn { display:flex; flex-direction:column; align-items:flex-start; gap:0.35rem; padding:0.85rem 1rem; background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px; text-decoration:none; color:#fff; transition:border-color 0.2s, background 0.2s; min-height:4.5rem; justify-content:center; box-sizing:border-box; }
    .post-nav-btn.post-nav-next { align-items:flex-end; text-align:right; }
    .post-nav-btn:hover:not(.post-nav-empty) { border-color:var(--primary-green); background:rgba(34,139,34,0.08); }
    .post-nav-btn.post-nav-empty { opacity:0.45; cursor:default; pointer-events:none; }
    .post-nav-inner { display:flex; flex-direction:row; align-items:center; gap:0.75rem; width:100%; min-width:0; }
    .post-nav-btn.post-nav-next .post-nav-inner { flex-direction:row; justify-content:flex-end; }
    .post-nav-thumb { width:72px; height:48px; object-fit:cover; border-radius:6px; flex-shrink:0; background:#111; }
    .post-nav-text-col { display:flex; flex-direction:column; gap:0.25rem; min-width:0; flex:1; }
    .post-nav-label { font-size:0.7rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--primary-green); font-weight:600; }
    .post-nav-title { font-size:0.9rem; color:var(--text-gray); line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .post-nav-btn:not(.post-nav-empty) .post-nav-title { color:#fff; }
    .related-posts-details { margin-top:1.25rem; border:1px solid var(--border-color); border-radius:12px; padding:0.5rem 1rem 1rem; background:rgba(255,255,255,0.02); }
    .related-posts-details summary { cursor:pointer; color:var(--primary-green); font-weight:650; padding:0.5rem 0; list-style:none; }
    .related-posts-details summary::-webkit-details-marker { display:none; }
    .related-posts-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:1rem; margin-top:0.75rem; }
    .related-post-card { display:flex; flex-direction:column; text-decoration:none; color:inherit; background:var(--bg-card); border:1px solid var(--border-color); border-radius:10px; overflow:hidden; transition:border-color 0.2s, transform 0.2s; }
    .related-post-card:hover { border-color:var(--primary-green); transform:translateY(-2px); }
    .related-post-thumb { width:100%; aspect-ratio:16/10; object-fit:cover; background:#111; }
    .related-post-heading { font-size:0.82rem; font-weight:600; line-height:1.35; padding:0.6rem 0.7rem; color:#fff; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .blog-engagement { margin-top:2.5rem; padding-top:1.5rem; border-top:1px solid var(--border-color); }
    .like-section { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .like-section .like-count { color:var(--text-gray); font-size:1rem; }
    .btn-like { display:inline-flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:8px; color:#fff; cursor:pointer; font-size:0.95rem; transition:all 0.2s; }
    .btn-like:hover { background:rgba(34,139,34,0.2); border-color:var(--primary-green); }
    .btn-like.liked { background:rgba(34,139,34,0.25); border-color:var(--primary-green); color:var(--primary-green); }
    .comments-title { font-size:1.35rem; margin-bottom:1rem; color:#fff; }
    .comment-form { display:flex; flex-direction:column; gap:0.85rem; margin-bottom:1.5rem; }
    .comment-form input, .comment-form textarea { padding:0.75rem 1rem; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:8px; color:#fff; font-size:1rem; font-family:inherit; }
    .comment-form textarea { min-height:100px; resize:vertical; }
    .comment-form input:focus, .comment-form textarea:focus { outline:none; border-color:var(--primary-green); }
    .comment-form .btn-submit { align-self:flex-start; padding:0.55rem 1.2rem; background:var(--primary-green); color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer; }
    .comment-form .btn-submit:hover { background:var(--primary-green-light); }
    .comment-form .comment-error { color:#ff6b6b; font-size:0.9rem; margin:0; }
    .comment-form .comment-success-msg { color:var(--primary-green); font-size:0.95rem; display:none; margin:0; }
    .comments-list { display:flex; flex-direction:column; gap:1rem; }
    .comment-item { padding:1rem; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; }
    .comment-item .comment-author { font-weight:600; color:var(--primary-green); margin-bottom:0.35rem; }
    .comment-item .comment-date { font-size:0.8rem; color:var(--text-gray); margin-bottom:0.5rem; }
    .comment-item .comment-body { color:#e0e0e0; line-height:1.5; }
  </style>
</head>
<body data-blog-slug="${escapeHtml(slug)}">
  <nav class="nav"><a href="../../index.html">Home</a> · <a href="/blog/">Blog</a></nav>
  <article class="prose">
    <h1>${escapeHtml(title)}</h1>
    ${featuredBlock}
    ${addLazyAttributesToBodyHtml(bodyHtml)}
    <div class="post-more-section" id="post-more-section">
      <nav class="post-nav-row" id="post-nav-row" style="display:none" aria-label="Adjacent articles">
        <div id="post-nav-prev-slot"></div>
        <div id="post-nav-next-slot"></div>
      </nav>
      <details class="related-posts-details" id="related-posts-details">
        <summary>More from the blog</summary>
        <div class="related-posts-wrap" id="related-posts-wrap">
          <div class="related-posts-grid" id="related-posts-grid" role="list"></div>
        </div>
      </details>
    </div>
    <div class="blog-engagement" id="blog-engagement">
      <div class="like-section">
        <span class="like-count" id="like-count">0 likes</span>
        <button type="button" class="btn-like" id="btn-like" aria-label="Like this post">
          <i class="fa-regular fa-heart" id="like-icon"></i>
          <span id="like-text">Like</span>
        </button>
      </div>
      <h2 class="comments-title">Comments</h2>
      <form class="comment-form" id="comment-form">
        <input type="text" id="comment-name" placeholder="Your name" required maxlength="100" aria-label="Your name" autocomplete="name">
        <textarea id="comment-content" placeholder="Write a comment..." required maxlength="2000" aria-label="Your comment"></textarea>
        <p class="comment-error" id="comment-error" style="display:none;"></p>
        <p class="comment-success-msg" id="comment-success-msg" style="display:none;"></p>
        <button type="submit" class="btn-submit">Post comment</button>
      </form>
      <div class="comments-list" id="comments-list">
        <p class="loading" id="comments-loading" style="color:var(--text-gray);"><i class="fa-solid fa-spinner fa-spin"></i> Loading comments...</p>
      </div>
    </div>
  </article>
  <script type="application/ld+json">${articleJsonLd(
    { title, author, publishedTime },
    ogImage,
  )}</script>
  <script src="../../assets/blog-article-client.js" defer></script>
</body>
</html>`
}

function hasBase64Images(html) {
  return typeof html === 'string' && /<img\b[^>]*\bsrc\s*=\s*["']data:image\//i.test(html)
}

function rewriteRelativeImageSrcsToPublicStorage(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/\bsrc\s*=\s*(["'])(\/?make-080ebf84-blog-images\/[^"']+)\1/gi, (_m, q, p) => {
    const objectPath = String(p || '').replace(/^\/+/, '').replace(/^make-080ebf84-blog-images\/?/, '')
    return `src=${q}${escapeHtml(BLOG_IMAGES_PUBLIC_BASE + '/' + objectPath)}${q}`
  })
}

function stripBase64Images(html) {
  if (!html || typeof html !== 'string') return ''
  // Remove only <img ... src="data:image/..."> tags (keep surrounding text)
  return html.replace(/<img\b[^>]*\bsrc\s*=\s*["']data:image\/[^"']+["'][^>]*>/gi, '')
}

function injectContextualLinksIntoBodyHtml({ bodyHtml, relatedPosts, maxLinks = 4 }) {
  if (!bodyHtml || typeof bodyHtml !== 'string') return ''
  const candidates = (relatedPosts || [])
    .filter((p) => p && p.slug && p.title)
    .slice(0, maxLinks)
  if (candidates.length === 0) return bodyHtml

  // Split by tags and only operate on text segments outside <a> to avoid nested anchors.
  const parts = bodyHtml.split(/(<[^>]+>)/g)
  const out = []
  let anchorDepth = 0
  let injected = 0

  for (const part of parts) {
    if (part.startsWith('<')) {
      if (/^<a\b/i.test(part)) anchorDepth++
      else if (/^<\/a\s*>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1)
      out.push(part)
      continue
    }
    if (anchorDepth > 0 || injected >= maxLinks) {
      out.push(part)
      continue
    }
    let seg = part
    for (const p of candidates) {
      if (injected >= maxLinks) break
      const title = String(p.title || '').trim()
      if (!title) continue
      const href = blogRelPath(p.slug)
      // Replace first occurrence only (case-insensitive), respecting word boundaries loosely.
      const re = new RegExp(`(^|[^\\w])(${escapeRegExp(title)})(?!\\w)`, 'i')
      if (!re.test(seg)) continue
      seg = seg.replace(re, (_full, before, matched) => {
        injected++
        return `${before}<a href="${escapeHtml(href)}" class="contextual-link">${escapeHtml(matched)}</a>`
      })
    }
    out.push(seg)
  }
  return out.join('')
}

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function main() {
  if (!ANON_KEY) {
    console.error('Set SUPABASE_ANON_KEY (Skister anon JWT).')
    process.exit(1)
  }

  const siteSeo = await fetchSiteSeoSafe()
  const base = (siteSeo.canonicalBase || siteSeo.siteUrl || SITE_URL).replace(/\/$/, '')

  const listRes = await fetchJson(`${EDGE}/blog/posts?forWebsite=1`)
  const posts = listRes.posts || []
  const visiblePosts = posts.filter((p) => p && p.slug && p.showOnWebsite !== false && !p.archived)
  const byNewest = visiblePosts
    .slice()
    .sort((a, b) => new Date(b.publishedTime) - new Date(a.publishedTime))

  const blogDir = path.join(OUT, 'blog')
  fs.mkdirSync(blogDir, { recursive: true })

  // Sitemap policy (SeaDays-aligned): only canonical URLs (no /index.html, no dynamic blog.html, no .html stubs)
  const sitemapUrls = [`${base}/`, `${base}/blog/`]

  let removedBase64Count = 0

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

    let processedBodyHtml = String(p.content || '')
    processedBodyHtml = rewriteRelativeImageSrcsToPublicStorage(processedBodyHtml)
    if (hasBase64Images(processedBodyHtml)) {
      // SeaDays behavior: never emit base64 images in final HTML.
      // (Upload-to-storage pipeline can be added later; for now we strip base64 for SEO and page size.)
      processedBodyHtml = stripBase64Images(processedBodyHtml)
      removedBase64Count++
    }

    // Inject contextual internal links (lightweight version of SeaDays behavior).
    const related = byNewest
      .filter((x) => x && x.slug && x.slug !== slug && x.showOnWebsite !== false && !x.archived)
      .slice(0, 8)
    processedBodyHtml = injectContextualLinksIntoBodyHtml({
      bodyHtml: processedBodyHtml,
      relatedPosts: related,
      maxLinks: 4,
    })

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
      bodyHtml: processedBodyHtml,
      slug,
    })
    fs.writeFileSync(path.join(slugDir, 'index.html'), page, 'utf8')

    const redirectTarget = `/blog/${encodeURIComponent(slug)}/`
    const redirectHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">` +
      `<meta name="robots" content="index, follow">` +
      `<link rel="canonical" href="${escapeHtml(canonical)}">` +
      `<meta http-equiv="refresh" content="0;url=${escapeHtml(redirectTarget)}">` +
      `<title>Redirect</title></head><body>` +
      `<script>window.location.replace("${redirectTarget.replace(/"/g, '\\"')}");</script>` +
      `<p>Redirecting to <a href="${escapeHtml(redirectTarget)}">article</a>...</p></body></html>`
    fs.writeFileSync(path.join(blogDir, `${slug}.html`), redirectHtml, 'utf8')

    sitemapUrls.push(canonical)
  }

  const featuredSlugs = toArrayFromSlugs(
    siteSeo.blogFeaturedSlugs || siteSeo.featuredBlogSlugs || siteSeo.featuredSlugs,
  )
  const featured = featuredSlugs.length
    ? featuredSlugs
        .map((slug) => visiblePosts.find((p) => p.slug === slug))
        .filter(Boolean)
    : []

  const nonFeaturedNewest = byNewest.filter((p) => !featuredSlugs.includes(p.slug))
  const featuredFallback = featured.length ? featured : nonFeaturedNewest.slice(0, 4)

  const indexLinks = posts
    .filter((p) => p && p.slug && p.showOnWebsite !== false && !p.archived)
    .map((p) => {
      const u = blogCanonicalUrl({ base, slug: p.slug })
      return `<li><a href="${escapeHtml(u)}">${escapeHtml(p.title || p.slug)}</a></li>`
    })
    .join('\n')

  const blogIndexTitle = siteSeo.blogIndexTitle || siteSeo.blogMetaTitle || 'Skister Blog'
  const blogIndexDescription =
    siteSeo.blogIndexDescription ||
    siteSeo.blogMetaDescription ||
    'Guides, tips, and updates from the Skister team.'
  const blogIndexCanonical = `${base}/blog/`
  const blogIndexOgImage = String(siteSeo.blogOgImage || siteSeo.ogImage || '').trim()
  const blogIndexSiteName = siteSeo.ogSiteName || 'Skister'

  const topicPills = [
    { key: '__all__', label: 'All' },
    { key: 'beginners', label: 'Beginners' },
    { key: 'kids', label: 'Kids' },
    { key: 'gear', label: 'Gear' },
    { key: 'costs', label: 'Costs' },
    { key: 'rentals', label: 'Rentals' },
    { key: 'trips', label: 'Trips' },
  ]

  function buildCardHtml(p) {
    const title = String(p.title || p.slug || '').trim()
    const excerptRaw = String(p.metaDescription || '').trim() || stripHtml(p.content || '').slice(0, 180)
    const excerpt = excerptRaw.length > 180 ? excerptRaw.slice(0, 177).trim() + '...' : excerptRaw
    const publishedIso = p.publishedTime ? new Date(p.publishedTime).toISOString() : ''
    const publishedShort = p.publishedTime ? new Date(p.publishedTime).toISOString().slice(0, 10) : ''
    const author = String(p.author || 'Skister Team')
    const slug = p.slug
    const href = blogRelPath(slug)
    const canonical = blogCanonicalUrl({ base, slug })
    const img = String(p.featuredImage || '').trim()
    const textBlob = escapeHtml(normalizeText(`${title} ${excerpt}`))
    return `
      <article class="article-card" data-title="${escapeHtml(title)}" data-search="${textBlob}" data-slug="${escapeHtml(slug)}">
        <a class="article-card-link" href="${escapeHtml(href)}" aria-label="${escapeHtml(title)}">
          <div class="article-card-media">
            ${
              img
                ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none'">`
                : `<div class="article-card-media-placeholder" aria-hidden="true">No image</div>`
            }
          </div>
          <div class="article-card-body">
            <div class="article-card-meta">
              <time datetime="${escapeHtml(publishedIso)}">${escapeHtml(publishedShort || '')}</time>
              <span class="dot" aria-hidden="true">·</span>
              <span>${escapeHtml(author)}</span>
            </div>
            <h2 class="article-card-title">${escapeHtml(title)}</h2>
            <p class="article-card-excerpt">${escapeHtml(excerpt)}</p>
            <p class="article-card-cta">Read →</p>
          </div>
        </a>
        <link rel="canonical" href="${escapeHtml(canonical)}">
      </article>
    `.trim()
  }

  const featuredRowHtml = featuredFallback
    .map((p) => {
      const title = String(p.title || p.slug || '').trim()
      const slug = p.slug
      const href = blogRelPath(slug)
      const img = String(p.featuredImage || '').trim()
      return `
        <a class="featured-card" href="${escapeHtml(href)}" aria-label="${escapeHtml(title)}">
          <div class="featured-card-media">
            ${
              img
                ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="eager" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.style.display='none'">`
                : `<div class="featured-card-media-placeholder" aria-hidden="true">No image</div>`
            }
          </div>
          <div class="featured-card-body">
            <p class="featured-card-title">${escapeHtml(title)}</p>
          </div>
        </a>
      `.trim()
    })
    .join('\n')

  const allCardsHtml = byNewest.map(buildCardHtml).join('\n')

  const blogIndex = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(blogIndexTitle)}</title>
  <meta name="description" content="${escapeHtml(blogIndexDescription)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(blogIndexCanonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(blogIndexTitle)}">
  <meta property="og:description" content="${escapeHtml(blogIndexDescription)}">
  <meta property="og:url" content="${escapeHtml(blogIndexCanonical)}">
  ${blogIndexOgImage ? `<meta property="og:image" content="${escapeHtml(blogIndexOgImage)}">` : ''}
  <meta property="og:site_name" content="${escapeHtml(blogIndexSiteName)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(blogIndexTitle)}">
  <meta name="twitter:description" content="${escapeHtml(blogIndexDescription)}">
  ${blogIndexOgImage ? `<meta name="twitter:image" content="${escapeHtml(blogIndexOgImage)}">` : ''}
  <link rel="icon" type="image/png" href="../assets/favicon.png">
  <style>
    :root { --bg:#0a0a0a; --panel:rgba(255,255,255,0.03); --border:rgba(255,255,255,0.1); --text:#fff; --muted:#b0b0b0; --accent:#228B22; }
    * { box-sizing:border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:var(--bg); color:var(--text); margin:0; }
    a { color:inherit; }
    .wrap { max-width: 1040px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    .topnav { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom: 1.75rem; }
    .topnav a { text-decoration:none; color:var(--muted); }
    .topnav a:hover { color:var(--text); }
    .brand { display:flex; gap:0.6rem; align-items:center; color:var(--text); font-weight:700; }
    .hero { padding: 1rem 0 1.25rem; }
    .hero h1 { margin:0 0 0.35rem; font-size:2.15rem; letter-spacing:-0.02em; }
    .hero p { margin:0; color:var(--muted); max-width: 60ch; line-height: 1.65; }
    .featured { margin-top: 1.75rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: 16px; background: var(--panel); }
    .featured h2 { margin:0 0 1rem; font-size: 1.1rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .featured-row { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
    @media (max-width: 900px) { .featured-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .featured-card { text-decoration:none; border:1px solid var(--border); border-radius: 12px; overflow:hidden; background: rgba(255,255,255,0.02); transition: transform 0.18s ease, border-color 0.18s ease; display:flex; flex-direction:column; min-height: 170px; }
    .featured-card:hover { transform: translateY(-2px); border-color: rgba(34,139,34,0.5); }
    .featured-card-media { width:100%; aspect-ratio: 16 / 10; background:#111; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    .featured-card-media img { width:100%; height:100%; object-fit:cover; display:block; }
    .featured-card-media-placeholder { color: var(--muted); font-size: 0.85rem; }
    .featured-card-body { padding: 0.75rem 0.85rem 0.9rem; }
    .featured-card-title { margin:0; font-size: 0.95rem; font-weight: 650; line-height: 1.35; display:-webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow:hidden; }
    .tools { margin-top: 1.25rem; display:flex; flex-wrap:wrap; gap: 0.75rem; align-items:center; }
    .search { flex: 1; min-width: 220px; display:flex; gap: 0.5rem; align-items:center; }
    .search input { width: 100%; padding: 0.75rem 0.9rem; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.04); color: var(--text); font-size: 1rem; }
    .pill-row { display:flex; flex-wrap:wrap; gap: 0.5rem; }
    .pill-row button { padding: 0.55rem 0.7rem; border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,0.03); color: var(--muted); cursor:pointer; font-weight: 600; font-size: 0.9rem; }
    .pill-row button[aria-pressed="true"] { background: rgba(34,139,34,0.18); border-color: rgba(34,139,34,0.45); color: var(--text); }
    .results-hint { margin-top: 0.75rem; color: var(--muted); font-size: 0.95rem; }
    .grid { margin-top: 1.25rem; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
    .article-card { border: 1px solid var(--border); border-radius: 16px; overflow:hidden; background: rgba(255,255,255,0.02); }
    .article-card-link { text-decoration:none; display:grid; grid-template-columns: 160px 1fr; gap: 0; color: inherit; }
    @media (max-width: 520px) { .article-card-link { grid-template-columns: 1fr; } }
    .article-card-media { width: 100%; height: 100%; background:#111; display:flex; align-items:center; justify-content:center; }
    .article-card-media img { width:100%; height:100%; object-fit:cover; display:block; }
    .article-card-media-placeholder { color: var(--muted); font-size: 0.85rem; padding: 1rem; }
    .article-card-body { padding: 1rem 1rem 1.1rem; }
    .article-card-meta { color: var(--muted); font-size: 0.9rem; display:flex; gap:0.5rem; align-items:center; margin-bottom: 0.35rem; }
    .dot { opacity: 0.7; }
    .article-card-title { margin: 0; font-size: 1.1rem; line-height: 1.35; letter-spacing:-0.01em; }
    .article-card-excerpt { margin: 0.45rem 0 0.75rem; color: var(--muted); line-height: 1.55; }
    .article-card-cta { margin: 0; color: var(--accent); font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="topnav">
      <a class="brand" href="../index.html" aria-label="Skister home">Skister</a>
      <nav style="display:flex; gap:1rem;">
        <a href="../index.html">Home</a>
        <a href="/blog/">Blog</a>
      </nav>
    </header>

    <section class="hero">
      <h1>${escapeHtml(blogIndexTitle)}</h1>
      <p>${escapeHtml(blogIndexDescription)}</p>
    </section>

    <section class="featured" aria-label="Featured posts">
      <h2>Featured</h2>
      <div class="featured-row">
${featuredRowHtml || ''}
      </div>
    </section>

    <section class="tools" aria-label="Search and filter">
      <div class="search">
        <input id="blogSearch" type="search" placeholder="Search articles" autocomplete="off" aria-label="Search articles">
      </div>
      <div class="pill-row" id="topicFilters" aria-label="Topic filters">
        ${topicPills
          .map(
            (t) =>
              `<button type="button" class="topic-pill" data-topic="${escapeHtml(t.key)}" aria-pressed="${
                t.key === '__all__' ? 'true' : 'false'
              }">${escapeHtml(t.label)}</button>`,
          )
          .join('')}
      </div>
    </section>
    <p class="results-hint" id="resultsHint"></p>

    <section class="grid" id="blogGrid" aria-label="All posts">
${allCardsHtml}
    </section>
  </div>

  <script>
  (function(){
    var grid = document.getElementById('blogGrid')
    var search = document.getElementById('blogSearch')
    var hint = document.getElementById('resultsHint')
    var filters = document.getElementById('topicFilters')
    if(!grid || !search || !filters) return

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.article-card'))
    var activeTopic = '__all__'
    var topicRules = {
      __all__: [],
      beginners: ['learn', 'beginner', 'start', 'first time', 'basics', 'anfänger', 'lernen'],
      kids: ['kid', 'kids', 'child', 'children', 'family', 'kind', 'kinder', 'eltern'],
      gear: ['gear', 'equipment', 'skischuhe', 'ski', 'ausrüstung', 'checklist', 'pack'],
      costs: ['cost', 'price', 'budget', 'kosten', 'preise', 'spar'],
      rentals: ['rental', 'rent', 'verleih', 'mieten', 'leihen'],
      trips: ['trip', 'urlaub', 'resort', 'allgäu', 'region', 'deutschland', 'klassenfahrt']
    }
    function setPressed(active){
      Array.prototype.slice.call(filters.querySelectorAll('button.topic-pill')).forEach(function(b){
        b.setAttribute('aria-pressed', String(b.getAttribute('data-topic') === active))
      })
    }
    function cardText(card){
      var t = card.getAttribute('data-search') || ''
      return String(t).toLowerCase()
    }
    function matchesTopic(text, topic){
      var rules = topicRules[topic] || []
      if(topic === '__all__' || rules.length === 0) return true
      return rules.some(function(k){ return text.includes(k) })
    }
    function apply(){
      var q = (search.value || '').trim().toLowerCase()
      var visible = 0
      cards.forEach(function(card){
        var text = cardText(card)
        var ok = true
        if(q) ok = ok && text.includes(q)
        ok = ok && matchesTopic(text, activeTopic)
        card.style.display = ok ? '' : 'none'
        if(ok) visible++
      })
      if(hint) hint.textContent = visible ? (visible + ' posts') : 'No matches'
    }
    filters.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('button[data-topic]')
      if(!btn) return
      activeTopic = btn.getAttribute('data-topic') || '__all__'
      setPressed(activeTopic)
      apply()
    })
    search.addEventListener('input', apply)
    search.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); apply() } })
    apply()
  })();
  </script>
</body>
</html>`
  fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndex, 'utf8')

  for (const line of String(siteSeo.sitemapExtraUrls || '')
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean)) {
    if (/^https?:\/\//i.test(line)) {
      sitemapUrls.push(line)
    }
  }

  const seen = new Set()
  const deduped = []
  for (const u of sitemapUrls) {
    if (!u || seen.has(u)) continue
    seen.add(u)
    deduped.push(u)
  }

  const today = new Date().toISOString().split('T')[0]
  const urlset = deduped
    .map((loc) => `  <url><loc>${escapeHtml(loc)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>
`
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8')

  const robotsBody = String(siteSeo.robotsTxt || '').trim()
    ? String(siteSeo.robotsTxt)
    : `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
  fs.writeFileSync(path.join(OUT, 'robots.txt'), robotsBody, 'utf8')

  if (removedBase64Count) console.warn('Removed base64 images from posts:', removedBase64Count)
  console.log('Wrote blog/*, sitemap.xml, robots.txt — posts:', posts.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
