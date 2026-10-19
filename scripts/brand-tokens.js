'use strict'

/** Approved SKISTER 2026 brand tokens (source: Skister-main/assets/Skister2026) */
const FAVICON_ASSET_VERSION = '20261011'

module.exports = {
  faviconAssetVersion: FAVICON_ASSET_VERSION,
  colors: {
    emerald: '#00af64',
    mint: '#61c58e',
    forest: '#053d2b',
    forestDeep: '#046b48',
    mist: '#f4faf7',
    primary: '#00af64',
    primaryDark: '#008f54',
    primaryDarkLightTheme: '#009456',
    primaryLight: '#61c58e',
    primaryForeground: '#f4faf7',
    primaryRgb: '0, 175, 100',
    primaryGradient:
      'linear-gradient(135deg, #046b48 0%, #00af64 52%, #61c58e 100%)',
    primaryGlowDark: 'rgba(0, 175, 100, 0.28)',
    primaryGlowDarkStrong: 'rgba(97, 197, 142, 0.38)',
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
