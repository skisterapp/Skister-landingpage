'use strict'

/** Bare paths served on GitHub Pages via /<name>/index.html stubs → canonical .html URLs */
const SHORT_LEGAL_HTML = {
  privacy: 'privacy.html',
  terms: 'terms.html',
  help: 'help.html',
  impressum: 'impressum.html',
}

function normalizedPathname(pathname) {
  var p = pathname || '/'
  if (p === '/index.html') return '/'
  if (p.length > '/index.html'.length && p.slice(-'/index.html'.length) === '/index.html') {
    p = p.slice(0, -'/index.html'.length) || '/'
  }
  if (/\.html$/i.test(p)) return p
  var bare = p.replace(/\/$/, '').split('/').pop()
  if (bare && SHORT_LEGAL_HTML[bare]) return '/' + SHORT_LEGAL_HTML[bare]
  if (p.length > 1 && p.charAt(p.length - 1) !== '/') p += '/'
  return p
}

function redirectTarget(pathname, search, hash) {
  var p = pathname || '/'
  var next = normalizedPathname(p)
  if (next === p) return null
  return next + (search || '') + (hash || '')
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SHORT_LEGAL_HTML, normalizedPathname, redirectTarget }
}
