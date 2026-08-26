/**
 * Loads Google's Preferred Sources publisher script at most once per page.
 * Call SkisterPreferredSources.ensureLoaded() after injecting google-add-preferred-source-btn
 * into the DOM (e.g. CSR blog-post.html). Static article pages include publisher.js in <head>.
 */
;(function (global) {
  var PUBLISHER_SRC = 'https://news.google.com/swg/js/v1/publisher.js'

  function hasPublisherScript() {
    return !!document.querySelector('script[src="' + PUBLISHER_SRC + '"]')
  }

  function ensureLoaded() {
    if (global.__skisterPreferredSourcesRequested) return
    if (hasPublisherScript()) {
      global.__skisterPreferredSourcesRequested = true
      return
    }
    global.__skisterPreferredSourcesRequested = true
    var script = document.createElement('script')
    script.async = true
    script.src = PUBLISHER_SRC
    document.head.appendChild(script)
  }

  global.SkisterPreferredSources = { ensureLoaded: ensureLoaded }
})(window)
