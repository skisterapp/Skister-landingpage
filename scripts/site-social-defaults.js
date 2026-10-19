'use strict'

const { assets } = require('./brand-tokens')

const SITE_ORIGIN = 'https://skister.app'

function defaultOgImageUrl() {
  return `${SITE_ORIGIN}${assets.appIcon}`
}

function socialImageMetaTags({ title, description, url, imageUrl }) {
  const image = imageUrl || defaultOgImageUrl()
  return [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${image}">`,
  ].join('\n  ')
}

module.exports = {
  SITE_ORIGIN,
  defaultOgImageUrl,
  socialImageMetaTags,
}
