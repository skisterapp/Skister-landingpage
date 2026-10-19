'use strict'

const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, 'legal-site.json')

function loadLegalSiteConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
}

function getStaticLegalSitemapUrls(base) {
  const cfg = loadLegalSiteConfig()
  const root = String(base || '').replace(/\/$/, '')
  const paths = Array.isArray(cfg.staticLegalSitemapPaths) ? cfg.staticLegalSitemapPaths : []
  const urls = paths.map(function (p) {
    const segment = String(p).startsWith('/') ? p : `/${p}`
    return `${root}${segment}`
  })
  if (cfg.impressumPublished) urls.push(`${root}/impressum.html`)
  return urls
}

function getImpressumFooterLinkHtml(relativePrefix) {
  const cfg = loadLegalSiteConfig()
  if (!cfg.impressumPublished) return ''
  const prefix = relativePrefix || '/'
  const href = prefix.endsWith('/') ? `${prefix}impressum.html` : `${prefix}/impressum.html`
  return `<a href="${href}">Impressum</a>`
}

function getUnpublishedImpressumRobotsDisallow() {
  const cfg = loadLegalSiteConfig()
  if (cfg.impressumPublished) return []
  return ['Disallow: /impressum.html']
}

module.exports = {
  loadLegalSiteConfig,
  getStaticLegalSitemapUrls,
  getImpressumFooterLinkHtml,
  getUnpublishedImpressumRobotsDisallow,
}
