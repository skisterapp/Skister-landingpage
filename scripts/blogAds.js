'use strict'

const fs = require('fs')
const path = require('path')

const PUBLISHER_RE = /^ca-pub-\d{10,20}$/i

function loadAdsConfig(repoRootDir) {
  const configPath = path.join(repoRootDir, 'data', 'ads-config.json')
  if (!fs.existsSync(configPath)) {
    return { enabled: false, publisherId: '', slots: {}, placement: {} }
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch {
    return { enabled: false, publisherId: '', slots: {}, placement: {} }
  }
}

function isValidPublisherId(publisherId) {
  return PUBLISHER_RE.test(String(publisherId || '').trim())
}

function isAdsLive(config) {
  if (!config || config.enabled !== true) return false
  if (!isValidPublisherId(config.publisherId)) return false
  const inArticle = String((config.slots && config.slots.inArticle) || '').trim()
  return Boolean(inArticle)
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function countWordsFromHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

function buildAdSlotHtml({ slotId, publisherId, label, minHeight, position, format }) {
  const safeLabel = escapeHtml(label || 'Advertisement')
  const safeSlot = escapeHtml(slotId)
  const safePub = escapeHtml(publisherId)
  const h = Math.max(90, Number(minHeight) || 280)
  const isInArticle = String(format || '').toLowerCase() === 'in-article'
  const insAttrs = isInArticle
    ? [
        `    <ins class="adsbygoogle"`,
        `      style="display:block;text-align:center;min-height:${h}px"`,
        `      data-ad-layout="in-article"`,
        `      data-ad-format="fluid"`,
        `      data-ad-client="${safePub}"`,
        `      data-ad-slot="${safeSlot}"></ins>`,
      ]
    : [
        `    <ins class="adsbygoogle"`,
        `      style="display:block;min-height:${h}px"`,
        `      data-ad-client="${safePub}"`,
        `      data-ad-slot="${safeSlot}"`,
        `      data-ad-format="auto"`,
        `      data-full-width-responsive="true"></ins>`,
      ]
  return [
    `<aside class="skister-ad skister-ad--${escapeHtml(position)}" data-ad-position="${escapeHtml(position)}" aria-label="${safeLabel}">`,
    `  <p class="skister-ad-label">${safeLabel}</p>`,
    `  <div class="skister-ad-frame" style="min-height:${h}px">`,
    ...insAttrs,
    `  </div>`,
    `</aside>`,
  ].join('\n')
}

/**
 * Insert in-content ads after major sections (h2 boundaries) based on article length.
 * Returns body HTML unchanged when ads are not live.
 */
function injectInContentAds({ bodyHtml, config }) {
  if (!isAdsLive(config)) return String(bodyHtml || '')
  const html = String(bodyHtml || '')
  const words = countWordsFromHtml(html)
  const placement = config.placement || {}
  const minFirst = Number(placement.minWordsForFirstAd) || 500
  const minSecond = Number(placement.minWordsForSecondAd) || 1200
  const minThird = Number(placement.minWordsForThirdAd) || 2200
  const reserve = Number(placement.reserveMinHeightPx) || 280
  const slotId = String(config.slots.inArticle || '').trim()
  const publisherId = String(config.publisherId).trim()
  const label = config.label || 'Advertisement'
  const format = String((config.formats && config.formats.inArticle) || 'in-article')

  if (words < minFirst) return html

  const parts = html.split(/(?=<h2\b)/i)
  if (parts.length < 3) {
    // Few headings: insert once after ~30% of paragraphs.
    const paras = html.split(/(?=<p\b)/i)
    if (paras.length < 6) return html
    const at = Math.max(2, Math.floor(paras.length * 0.3))
    const ad = buildAdSlotHtml({
      slotId,
      publisherId,
      label,
      minHeight: reserve,
      position: 'mid-1',
      format,
    })
    return [...paras.slice(0, at), ad, ...paras.slice(at)].join('')
  }

  const desired = []
  if (words >= minFirst) desired.push(Math.max(1, Math.floor(parts.length * 0.25)))
  if (words >= minSecond) desired.push(Math.max(2, Math.floor(parts.length * 0.5)))
  if (words >= minThird) desired.push(Math.max(3, Math.floor(parts.length * 0.72)))

  const used = new Set()
  const out = []
  for (let i = 0; i < parts.length; i++) {
    out.push(parts[i])
    if (!desired.includes(i)) continue
    if (used.has(i)) continue
    // Never place before meaningful content / never stack.
    if (i < 1) continue
    used.add(i)
    const pos = `mid-${used.size}`
    out.push(
      buildAdSlotHtml({
        slotId,
        publisherId,
        label,
        minHeight: reserve,
        position: pos,
        format,
      }),
    )
  }
  return out.join('')
}

function buildEndOfArticleAdHtml(config) {
  if (!isAdsLive(config)) return ''
  const endSlot = String((config.slots && config.slots.endOfArticle) || config.slots.inArticle || '').trim()
  if (!endSlot) return ''
  const placement = config.placement || {}
  return buildAdSlotHtml({
    slotId: endSlot,
    publisherId: String(config.publisherId).trim(),
    label: config.label || 'Advertisement',
    minHeight: Number(placement.reserveMinHeightPx) || 280,
    position: 'end',
    format: String((config.formats && config.formats.endOfArticle) || 'display'),
  })
}

function adsenseAccountMetaTag(config) {
  if (!isValidPublisherId(config && config.publisherId)) return ''
  return `<meta name="google-adsense-account" content="${escapeHtml(String(config.publisherId).trim())}">`
}

function adsClientScriptTag(config) {
  if (!isAdsLive(config)) return ''
  return '<script src="/assets/blog-ads.js" defer></script>'
}

function adsCss() {
  return [
    '.skister-ad { margin: 1.75rem 0; padding: 0; max-width: 100%; }',
    '.skister-ad-label { margin: 0 0 0.4rem; font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-gray); }',
    '.skister-ad-frame { width: 100%; max-width: 100%; overflow: hidden; border-radius: 8px; background: rgba(255,255,255,0.02); }',
    '.skister-ad.skister-ad--empty { display: none; }',
    '.skister-ad ins.adsbygoogle { display: block; width: 100%; }',
  ].join('\n    ')
}

module.exports = {
  loadAdsConfig,
  isValidPublisherId,
  isAdsLive,
  injectInContentAds,
  buildEndOfArticleAdHtml,
  adsClientScriptTag,
  adsenseAccountMetaTag,
  adsCss,
  countWordsFromHtml,
}
