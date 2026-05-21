#!/usr/bin/env node
/**
 * Verify live SEO redirects and canonical tags for https://skister.app/
 * Usage: node scripts/verify-seo-redirects.mjs [--base https://skister.app]
 */
'use strict'

const BASE = (process.argv.find((a) => a.startsWith('--base=')) || '--base=https://skister.app')
  .split('=')[1]
  .replace(/\/$/, '')

const REDIRECT_CASES = [
  { url: 'http://skister.app/', expectFinal: `${BASE}/`, minRedirects: 1 },
  { url: 'http://www.skister.app/', expectFinal: `${BASE}/`, minRedirects: 1 },
  { url: 'https://www.skister.app/', expectFinal: `${BASE}/`, minRedirects: 1 },
  { url: 'http://skister.app/index.html', expectFinal: `${BASE}/`, minRedirects: 1 },
  { url: 'http://www.skister.app/index.html', expectFinal: `${BASE}/`, minRedirects: 1 },
  { url: 'https://skister.app/index.html', expectFinal: `${BASE}/`, minRedirects: 0 },
  { url: 'https://www.skister.app/index.html', expectFinal: `${BASE}/`, minRedirects: 1 },
]

async function fetchHead(url, { follow }) {
  const res = await fetch(url, { method: 'HEAD', redirect: follow ? 'follow' : 'manual' })
  return res
}

async function fetchGet(url) {
  const res = await fetch(url, { redirect: 'follow' })
  const text = await res.text()
  return { res, text }
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)
  return m ? m[1].trim() : ''
}

async function checkRedirectCase({ url, expectFinal, minRedirects }) {
  const errors = []
  let hops = 0
  let current = url
  let seen = new Set()

  while (hops < 10) {
    if (seen.has(current)) {
      errors.push(`${url}: redirect loop at ${current}`)
      break
    }
    seen.add(current)
    const res = await fetchHead(current, { follow: false })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) {
        errors.push(`${url}: ${res.status} without Location`)
        break
      }
      current = new URL(loc, current).href
      hops += 1
      continue
    }
    if (res.status >= 200 && res.status < 300) {
      const final = current.replace(/\/index\.html$/, '/').replace(/([^/])$/, '$1/')
      const normalized = current.endsWith('/index.html')
        ? current.slice(0, -'/index.html'.length) + '/'
        : current.endsWith('/')
          ? current
          : current + '/'
      if (normalized !== expectFinal && current !== expectFinal) {
        if (url.includes('index.html') && res.status === 200) {
          return errors
        }
        if (normalized.replace(/\/$/, '') !== expectFinal.replace(/\/$/, '')) {
          errors.push(`${url}: final URL ${current}, expected ${expectFinal}`)
        }
      }
      if (hops < minRedirects && !url.includes('https://skister.app/index.html')) {
        errors.push(`${url}: expected at least ${minRedirects} redirect(s), got ${hops}`)
      }
      return errors
    }
    errors.push(`${url}: unexpected status ${res.status}`)
    return errors
  }
  return errors
}

async function checkCanonicalOnHome() {
  const errors = []
  const warnings = []
  const { res, text } = await fetchGet(`${BASE}/`)
  if (!res.ok) errors.push(`Homepage fetch failed: ${res.status}`)
  const canonical = extractCanonical(text)
  if (canonical !== `${BASE}/`) errors.push(`Homepage canonical is "${canonical}", expected "${BASE}/"`)
  if (!text.includes('site-canonical.js')) {
    warnings.push(
      'Live homepage does not yet include scripts/site-canonical.js — deploy this commit, then re-run verify:redirects.',
    )
  }
  return { errors, warnings }
}

async function checkIndexHtmlOnApex() {
  const warnings = []
  const res = await fetchHead(`${BASE}/index.html`, { follow: false })
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location')
    if (loc && loc.replace(/\/$/, '') !== BASE) {
      warnings.push(`${BASE}/index.html redirects to ${loc} (expected ${BASE}/)`)
    }
    return warnings
  }
  if (res.status === 200) {
    warnings.push(
      `${BASE}/index.html returns 200 on GitHub Pages (no edge 301). rel=canonical and site-canonical.js dedupe after deploy.`,
    )
  }
  return warnings
}

async function checkRobotsAndSitemap() {
  const errors = []
  const robots = await fetchGet(`${BASE}/robots.txt`)
  if (!robots.res.ok) errors.push(`robots.txt: ${robots.res.status}`)
  else if (!/Sitemap:\s*https:\/\/skister\.app\/sitemap\.xml/i.test(robots.text)) {
    errors.push('robots.txt missing Sitemap: https://skister.app/sitemap.xml')
  }
  if (/Disallow:\s*\//i.test(robots.text)) errors.push('robots.txt blocks entire site')

  const sitemap = await fetchGet(`${BASE}/sitemap.xml`)
  if (!sitemap.res.ok) errors.push(`sitemap.xml: ${sitemap.res.status}`)
  else {
    const bad = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1].trim())
      .filter((u) => /www\.|index\.html|\.html$/i.test(u) && !u.endsWith('.xml'))
    if (bad.length) errors.push(`sitemap.xml non-canonical URLs: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}`)
  }
  return errors
}

async function main() {
  const errors = []
  const warnings = []
  for (const c of REDIRECT_CASES) {
    errors.push(...(await checkRedirectCase(c)))
  }
  const home = await checkCanonicalOnHome()
  errors.push(...home.errors)
  warnings.push(...home.warnings)
  warnings.push(...(await checkIndexHtmlOnApex()))
  errors.push(...(await checkRobotsAndSitemap()))

  if (warnings.length) {
    console.warn('Warnings:\n')
    for (const w of warnings) console.warn(`  - ${w}`)
  }
  if (errors.length) {
    console.error('SEO redirect verification FAILED:\n')
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  console.log(`SEO redirect verification OK (${BASE})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
