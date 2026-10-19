'use strict'

const fs = require('fs')
const path = require('path')

const OVERRIDES_PATH = path.join(__dirname, 'blog-seo-overrides.json')

function loadBlogSeoOverrides() {
  try {
    const raw = fs.readFileSync(OVERRIDES_PATH, 'utf8')
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Trim only clearly over-long snippets at sentence boundaries (not a hard 160-char chop).
 */
function refineMetaDescription(description, bodyPlain) {
  let d = String(description || '').replace(/\s+/g, ' ').trim()
  const body = String(bodyPlain || '').replace(/\s+/g, ' ').trim()
  if (!d && body) d = body
  if (d.length > 280) {
    const window = d.slice(0, 265)
    const sentenceEnd = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf('! '),
      window.lastIndexOf('? '),
    )
    if (sentenceEnd >= 120) d = window.slice(0, sentenceEnd + 1).trim()
    else d = window.trimEnd() + '…'
  }
  if (d.length < 70 && body.length >= 90) {
    const window = body.slice(0, 220)
    const sentenceEnd = window.search(/[.!?]\s/)
    if (sentenceEnd >= 70) d = window.slice(0, sentenceEnd + 1).trim()
    else if (window.length >= 70) d = window.slice(0, 155).trimEnd() + '…'
  }
  return d
}

function resolvePostSeoMeta({ slug, title, description, bodyHtml }) {
  const overrides = loadBlogSeoOverrides()
  const row = overrides[slug] || {}
  let metaTitle = String(row.metaTitle || title || '').trim()
  let metaDescription = String(row.metaDescription || description || '').trim()
  const bodyPlain = stripHtml(bodyHtml)
  if (!metaDescription) metaDescription = bodyPlain.slice(0, 200)
  metaDescription = refineMetaDescription(metaDescription, bodyPlain)
  return { metaTitle, metaDescription }
}

module.exports = {
  loadBlogSeoOverrides,
  refineMetaDescription,
  resolvePostSeoMeta,
  stripHtml,
}
