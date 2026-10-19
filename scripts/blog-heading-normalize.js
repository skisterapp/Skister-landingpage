'use strict'

function decodeBasicEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeHeadingCompareText(html) {
  return decodeBasicEntities(String(html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * CMS bodies often repeat the post title as <h1>. The static template already renders one <h1>.
 * Demote body <h1> to <h2> and drop a leading duplicate headline that matches the page title.
 */
function normalizeBlogBodyHeadingsInHtml(bodyHtml, pageTitle) {
  if (!bodyHtml || typeof bodyHtml !== 'string') return ''
  let out = bodyHtml
  out = out.replace(/<h1(\s[^>]*)?>\s*<\/h1>/gi, '')
  out = out.replace(/<h1\b/gi, '<h2')
  out = out.replace(/<\/h1>/gi, '</h2>')
  out = out.replace(/<h2(\s[^>]*)?>\s*<\/h2>/gi, '')
  const titleKey = normalizeHeadingCompareText(pageTitle)
  if (!titleKey) return out
  const lead = out.trimStart()
  const h2Match = lead.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i)
  if (h2Match && normalizeHeadingCompareText(h2Match[1]) === titleKey) {
    out = lead.slice(h2Match[0].length).trimStart()
  }
  return out
}

module.exports = {
  normalizeBlogBodyHeadingsInHtml,
  normalizeHeadingCompareText,
}
