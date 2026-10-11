'use strict'

/** Approved SKISTER 2026 brand tokens (source: Skister-main/assets/Skister2026) */
const FAVICON_ASSET_VERSION = '20261011'

module.exports = {
  faviconAssetVersion: FAVICON_ASSET_VERSION,
  colors: {
    emerald: '#00AF64',
    mint: '#61C58E',
    forest: '#053D2B',
    mist: '#F4FAF7',
    primary: '#00AF64',
    primaryLight: '#61C58E',
    primaryRgb: '0, 175, 100',
  },
  assets: {
    logoWhite: '/assets/skister-logo-white.png',
    logoPrimary: '/assets/skister-logo-primary.png',
    logoForest: '/assets/skister-logo-forest.png',
    appIcon: '/assets/skister-app-icon.png',
    faviconIco: `/favicon.ico?v=${FAVICON_ASSET_VERSION}`,
    faviconPng32: `/favicon-32x32.png?v=${FAVICON_ASSET_VERSION}`,
    faviconPng16: `/favicon-16x16.png?v=${FAVICON_ASSET_VERSION}`,
    faviconPng: `/assets/favicon.png?v=${FAVICON_ASSET_VERSION}`,
    appleTouchIcon: `/apple-touch-icon.png?v=${FAVICON_ASSET_VERSION}`,
    webManifest: `/site.webmanifest?v=${FAVICON_ASSET_VERSION}`,
  },
  retired: {
    hexPrimary: '#228B22',
    hexPrimaryLight: '#2da82d',
    rgbPrimary: '34, 139, 34',
    supabaseLogoUrl:
      'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterLogoWeb.png',
  },
}
