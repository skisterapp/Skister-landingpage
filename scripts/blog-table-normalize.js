'use strict'

const BLOG_PROSE_TABLE_CSS = `
    .prose { max-width: 100%; min-width: 0; }
    body { overflow-x: clip; }
    .prose .blog-table-scroll,
    .prose .TyagGW_tableContainer {
      display: block;
      width: 100%;
      max-width: 100%;
      margin: 1rem 0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
    }
    .prose .blog-table-scroll:focus-visible {
      outline: 2px solid #00AF64;
      outline-offset: 2px;
    }
    .prose .TyagGW_tableWrapper,
    .prose .TyagGW_tableContainer > div {
      display: block;
      max-width: none;
      width: max-content;
      min-width: 0;
    }
    .prose table {
      border-collapse: collapse;
      width: auto;
      min-width: min(100%, 36rem);
      border: 1px solid rgba(255,255,255,0.28);
    }
    .prose th, .prose td {
      border: 1px solid rgba(255,255,255,0.28);
      padding: 0.5rem 0.75rem;
      text-align: left;
      vertical-align: top;
    }
    .prose thead th { background: rgba(255,255,255,0.08); font-weight: 600; }
    .prose tbody tr:nth-child(even) { background: rgba(255,255,255,0.03); }
`

const PASTE_CLASS_RE = /\sclass="[^"]*(?:TyagGW|w-fit|min-w-|thread-content|flex-col-reverse|flex\s+flex-col)[^"]*"/gi
const PASTE_DATA_RE = /\sdata-(?:start|end|col-size|section-id)="[^"]*"/gi

function normalizeBlogTablesInHtml(html) {
  if (!html || typeof html !== 'string') return ''
  let out = html
  out = out.replace(
    /<div class="TyagGW_tableContainer">\s*<div[^>]*>\s*(?:<br\s*\/?>\s*)?/gi,
    '<div class="blog-table-scroll" tabindex="0" role="region" aria-label="Tabelle">',
  )
  out = out.replace(/<div class="TyagGW_tableContainer">/gi, '<div class="blog-table-scroll" tabindex="0" role="region" aria-label="Tabelle">')
  out = out.replace(/<\/table>\s*<\/div>\s*<\/div>/gi, '</table></div>')
  out = out.replace(/<\/table>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '</table></div>')
  out = out.replace(PASTE_CLASS_RE, '')
  out = out.replace(PASTE_DATA_RE, '')
  out = out.replace(/\sclass=""/g, '')
  out = out.replace(/<div class="blog-table-scroll"[^>]*>\s*<\/div>\s*<\/div>/gi, '')
  out = out.replace(/<div class="blog-table-scroll"[^>]*>\s*<\/div>/gi, '')
  return out
}

function replaceLegacyTableCssInArticleStyle(styleBlock) {
  if (!styleBlock) return styleBlock
  const endMarker = '.post-more-section'
  const end = styleBlock.indexOf(endMarker)
  if (end === -1) return styleBlock
  const beforePostMore = styleBlock.slice(0, end)
  const hasTableCss =
    beforePostMore.includes('blog-table-scroll') ||
    beforePostMore.includes('TyagGW_tableContainer') ||
    beforePostMore.includes('.prose { max-width: 100%; min-width: 0; }')
  if (!hasTableCss) return styleBlock
  let start = beforePostMore.indexOf('.prose { max-width: 100%; min-width: 0; }')
  if (start === -1) start = beforePostMore.indexOf('.prose .TyagGW_tableContainer')
  if (start === -1) start = beforePostMore.indexOf('.prose .blog-table-scroll')
  if (start === -1) return styleBlock
  return beforePostMore.slice(0, start) + BLOG_PROSE_TABLE_CSS.trim() + '\n    ' + styleBlock.slice(end)
}

module.exports = {
  BLOG_PROSE_TABLE_CSS,
  normalizeBlogTablesInHtml,
  replaceLegacyTableCssInArticleStyle,
}
