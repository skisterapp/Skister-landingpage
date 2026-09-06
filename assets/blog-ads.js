/**
 * Loads AdSense only when production ads-config is enabled with a real publisher ID.
 * Safe no-op when ads are disabled, blocked, or misconfigured.
 */
;(function () {
  var CONFIG_URL = '/data/ads-config.json'
  var PUBLISHER_RE = /^ca-pub-\d{10,20}$/i

  function hideEmptyAds() {
    var nodes = document.querySelectorAll('.skister-ad')
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      var ins = el.querySelector('ins.adsbygoogle')
      if (!ins) {
        el.classList.add('skister-ad--empty')
        continue
      }
      // If the network never fills the slot, collapse after a grace period.
      window.setTimeout(function (node, unit) {
        return function () {
          var h = unit.offsetHeight || 0
          if (h < 40) node.classList.add('skister-ad--empty')
        }
      }(el, ins), 3500)
    }
  }

  function pushAds() {
    try {
      var units = document.querySelectorAll('ins.adsbygoogle')
      if (!units.length) return
      window.adsbygoogle = window.adsbygoogle || []
      for (var i = 0; i < units.length; i++) {
        window.adsbygoogle.push({})
      }
    } catch (e) {
      hideEmptyAds()
    }
  }

  function loadScript(publisherId) {
    if (document.querySelector('script[data-skister-adsense="1"]')) {
      pushAds()
      hideEmptyAds()
      return
    }
    var s = document.createElement('script')
    s.async = true
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(publisherId)
    s.crossOrigin = 'anonymous'
    s.setAttribute('data-skister-adsense', '1')
    s.onload = function () {
      pushAds()
      hideEmptyAds()
    }
    s.onerror = hideEmptyAds
    document.head.appendChild(s)
  }

  function run(config) {
    if (!config || config.enabled !== true) return
    var publisherId = String(config.publisherId || '').trim()
    if (!PUBLISHER_RE.test(publisherId)) return
    if (!document.querySelector('ins.adsbygoogle')) return
    loadScript(publisherId)
  }

  fetch(CONFIG_URL, { credentials: 'omit', cache: 'no-store' })
    .then(function (r) {
      return r.ok ? r.json() : null
    })
    .then(run)
    .catch(function () {})
})()
