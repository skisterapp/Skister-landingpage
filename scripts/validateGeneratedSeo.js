#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { loadAdsConfig, isValidPublisherId, isAdsLive } = require('./blogAds')

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function listFilesRecursively(rootDir) {
  const out = []
  const queue = [rootDir]
  while (queue.length) {
    const dir = queue.pop()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) queue.push(full)
      else out.push(full)
    }
  }
  return out
}

function extractMetaRobots(html) {
  const m = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["'][^>]*>/i)
  return m ? String(m[1] || '').trim() : ''
}

function extractCanonicalHref(html) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)
  return m ? String(m[1] || '').trim() : ''
}

function extractLang(html) {
  const m = html.match(/<html[^>]+lang=["']([^"']+)["']/i)
  return m ? String(m[1] || '').trim() : ''
}

function isBlogStubHtmlFile(filePath) {
  if (!filePath.endsWith('.html')) return false
  if (filePath.endsWith(`${path.sep}index.html`)) return false
  if (!filePath.includes(`${path.sep}blog${path.sep}`)) return false
  return true
}

function validate({ repoRootDir }) {
  const errors = []
  const warnings = []
  const blogDir = path.join(repoRootDir, 'blog')
  const sitemapPath = path.join(repoRootDir, 'sitemap.xml')
  const robotsPath = path.join(repoRootDir, 'robots.txt')
  const adsConfig = loadAdsConfig(repoRootDir)

  if (!fs.existsSync(blogDir)) errors.push(`Missing blog dir: ${blogDir}`)
  if (!fs.existsSync(sitemapPath)) errors.push(`Missing sitemap: ${sitemapPath}`)
  if (!fs.existsSync(robotsPath)) errors.push(`Missing robots: ${robotsPath}`)
  if (errors.length) return { errors, warnings }

  const sitemap = readUtf8(sitemapPath)
  const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => String(m[1] || '').trim())
  const sitemapHasStub = sitemapUrls.some((u) => /\.html($|\?)/i.test(u) || /\/blog\/[^/]+\.html$/i.test(u))
  if (sitemapHasStub) errors.push('sitemap.xml contains a .html URL (blog stub). Only canonical URLs should be listed.')

  const blogFiles = listFilesRecursively(blogDir).filter((p) => p.endsWith('.html'))
  const stubFiles = blogFiles.filter((p) => isBlogStubHtmlFile(p))
  const articleIndexFiles = blogFiles.filter((p) => p.endsWith(`${path.sep}index.html`) && p.includes(`${path.sep}blog${path.sep}`) && !p.endsWith(`${path.sep}blog${path.sep}index.html`))

  for (const filePath of stubFiles) {
    const html = readUtf8(filePath)
    const robots = extractMetaRobots(html).toLowerCase().replace(/\s+/g, '')
    if (robots !== 'noindex,follow') errors.push(`Stub must be robots=noindex,follow: ${path.relative(repoRootDir, filePath)}`)
    const canonical = extractCanonicalHref(html)
    if (!canonical) errors.push(`Stub must include rel=canonical: ${path.relative(repoRootDir, filePath)}`)
    if (canonical && !canonical.endsWith('/')) errors.push(`Stub canonical should end with trailing slash: ${path.relative(repoRootDir, filePath)}`)
  }

  const titles = new Map()
  const descriptions = new Map()
  for (const filePath of articleIndexFiles) {
    const html = readUtf8(filePath)
    const rel = path.relative(repoRootDir, filePath)
    const canonical = extractCanonicalHref(html)
    if (!canonical) errors.push(`Article must include rel=canonical: ${rel}`)
    if (canonical && !canonical.endsWith('/')) errors.push(`Article canonical should end with trailing slash: ${rel}`)
    const robots = extractMetaRobots(html).toLowerCase().replace(/\s+/g, '')
    if (robots.includes('noindex')) errors.push(`Article must not be noindex: ${rel}`)
    if (!/application\/ld\+json/i.test(html)) errors.push(`Article missing JSON-LD: ${rel}`)
    if (!/BlogPosting|Article/i.test(html)) errors.push(`Article JSON-LD should include BlogPosting/Article: ${rel}`)
    if (!/BreadcrumbList/i.test(html)) warnings.push(`Article missing BreadcrumbList schema: ${rel}`)
    const lang = extractLang(html)
    if (lang && lang !== 'de' && /[äöüß]|Skigebiet|Skiverleih|Skifahren/i.test(html)) {
      warnings.push(`German article uses lang="${lang}": ${rel}`)
    }
    if (!sitemapUrls.includes(canonical) && canonical) {
      errors.push(`Article canonical missing from sitemap: ${canonical}`)
    }
    const titleM = html.match(/<title>([\s\S]*?)<\/title>/i)
    const title = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : ''
    const descM = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    const desc = descM ? descM[1].trim() : ''
    if (title) {
      if (titles.has(title)) errors.push(`Duplicate title "${title}" in ${rel} and ${titles.get(title)}`)
      else titles.set(title, rel)
    }
    if (desc) {
      if (descriptions.has(desc)) errors.push(`Duplicate description in ${rel} and ${descriptions.get(desc)}`)
      else descriptions.set(desc, rel)
    }
    // Ads must not appear unless config is live with valid publisher.
    const hasAdDom = /<ins\b[^>]*class=["'][^"']*adsbygoogle|class=["'][^"']*skister-ad\b/i.test(html)
    if (hasAdDom && !isAdsLive(adsConfig)) {
      errors.push(`Ad markup present but ads-config is not live: ${rel}`)
    }
  }

  if (adsConfig.enabled === true && !isValidPublisherId(adsConfig.publisherId)) {
    errors.push('data/ads-config.json has enabled=true but publisherId is missing/invalid (expected ca-pub-…).')
  }

  const { errors: linkErrors } = validateInternalLinks({ repoRootDir })
  errors.push(...linkErrors)

  return { errors, warnings }
}

function validateInternalLinks({ repoRootDir }) {
  const errors = []
  const blogIndexPath = path.join(repoRootDir, 'blog', 'index.html')
  if (!fs.existsSync(blogIndexPath)) return { errors: [`Missing blog index: ${blogIndexPath}`] }
  const html = readUtf8(blogIndexPath)
  const hrefs = Array.from(html.matchAll(/\shref=["']([^"']+)["']/g)).map((m) => String(m[1] || '').trim())
  const bad = hrefs.filter((h) => /\/blog\/[^/]+\.html$/i.test(h))
  if (bad.length) errors.push('blog/index.html contains links to .html stubs; links should point at /blog/{slug}/ canonical paths.')
  if (!/application\/ld\+json/i.test(html)) errors.push('blog/index.html missing JSON-LD')
  return { errors }
}

function main() {
  const repoRootDir = path.join(__dirname, '..')
  const { errors, warnings } = validate({ repoRootDir })
  if (warnings.length) {
    console.warn('SEO validation warnings:\n' + warnings.slice(0, 20).map((e) => `- ${e}`).join('\n'))
    if (warnings.length > 20) console.warn(`… and ${warnings.length - 20} more warnings`)
  }
  if (!errors.length) {
    console.log('SEO validation OK')
    console.log('Ads live:', isAdsLive(loadAdsConfig(repoRootDir)) ? 'yes' : 'no')
    return
  }
  console.error('SEO validation failed:\n' + errors.map((e) => `- ${e}`).join('\n'))
  process.exit(1)
}

main()
