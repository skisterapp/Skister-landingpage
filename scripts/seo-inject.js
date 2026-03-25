/**
 * Fetches site-wide SEO from the Skister Edge Function and fills empty meta tags / title.
 * Add early in <head>: <script src="scripts/seo-inject.js" defer></script>
 */
;(function () {
  var API = 'https://ayomhapkzckbhgwxenwr.supabase.co/functions/v1/make-server-080ebf84'
  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b21oYXBremNrYmhnd3hlbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDU5NzEsImV4cCI6MjA4NzE4MTk3MX0.z5ZOt2q6wG75jgr2qM9cSguDAwrq9scwt6YzRlXuKO8'

  function setMetaIfEmpty(nameOrProp, content, isProp) {
    if (!content) return
    var attr = isProp ? 'property' : 'name'
    var el = document.querySelector('meta[' + attr + '="' + nameOrProp + '"]')
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attr, nameOrProp)
      document.head.appendChild(el)
    }
    if (!el.getAttribute('content') || el.getAttribute('content').trim() === '') {
      el.setAttribute('content', content)
    }
  }

  function run() {
    fetch(API + '/site-seo', {
      headers: { Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
    })
      .then(function (r) {
        return r.json()
      })
      .then(function (data) {
        var s = data && data.seo ? data.seo : data
        if (data.error || !(s && (s.metaTitle || s.metaDescription))) return
        setMetaIfEmpty('description', s.metaDescription, false)
        setMetaIfEmpty('robots', s.robots, false)
        setMetaIfEmpty('max-image-preview', s.maxImagePreview, false)
        setMetaIfEmpty('og:site_name', s.ogSiteName, true)
        setMetaIfEmpty('article:author', s.articleAuthor, true)
        if (s.ogImage) {
          setMetaIfEmpty('og:image', s.ogImage, true)
          setMetaIfEmpty('twitter:image', s.ogImage, true)
        }
        if (!document.title || document.title === '') {
          document.title = s.metaTitle || document.title
        }
      })
      .catch(function () {})
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run)
  } else {
    run()
  }
})()
