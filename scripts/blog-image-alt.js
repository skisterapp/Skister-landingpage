'use strict'

const fs = require('fs')
const path = require('path')

const OVERRIDES_PATH = path.join(__dirname, 'blog-image-alt-overrides.json')

function loadBlogImageAltOverrides() {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function applyBlogImageAltAttributes(html) {
  if (!html || typeof html !== 'string') return ''
  const overrides = loadBlogImageAltOverrides()
  return html.replace(/<img\b([^>]*?)>/gi, (full, attrs) => {
    if (/\balt\s*=/i.test(attrs)) return full
    const srcM = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
    const src = srcM ? srcM[1].trim() : ''
    const alt = overrides[src]
    if (!alt) return full
    const trimmed = attrs.trim()
    return `<img ${trimmed} alt="${escapeHtmlAttr(alt)}">`
  })
}

module.exports = {
  loadBlogImageAltOverrides,
  applyBlogImageAltAttributes,
}
