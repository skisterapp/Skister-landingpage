/**
 * Canonical host enforcement (client-side).
 * - Redirects /index.html and */index.html to directory URLs (preserves query + hash).
 * - Ensures <link rel="canonical"> matches https://skister.app + normalized path.
 *
 * Load synchronously in <head> (no defer): <script src="/scripts/site-canonical.js"></script>
 */
;(function () {
  var SITE_ORIGIN = 'https://skister.app'

  function normalizedPathname(pathname) {
    var p = pathname || '/'
    if (p === '/index.html') return '/'
    if (p.length > '/index.html'.length && p.slice(-'/index.html'.length) === '/index.html') {
      p = p.slice(0, -'/index.html'.length) || '/'
    }
    if (p.length > 1 && p.charAt(p.length - 1) !== '/') p += '/'
    return p
  }

  function redirectTarget() {
    var p = location.pathname
    var next = normalizedPathname(p)
    if (next === p) return null
    return next + location.search + location.hash
  }

  function ensureCanonicalLink() {
    var href = SITE_ORIGIN + normalizedPathname(location.pathname)
    var el = document.querySelector('link[rel="canonical"]')
    if (!el) {
      el = document.createElement('link')
      el.setAttribute('rel', 'canonical')
      document.head.appendChild(el)
    }
    if (el.getAttribute('href') !== href) el.setAttribute('href', href)
  }

  var target = redirectTarget()
  if (target) {
    location.replace(target)
    return
  }
  ensureCanonicalLink()
})()
