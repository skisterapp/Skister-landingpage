#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

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

function isBlogStubHtmlFile(filePath) {
  if (!filePath.endsWith('.html')) return false
  if (filePath.endsWith(`${path.sep}index.html`)) return false
  if (!filePath.includes(`${path.sep}blog${path.sep}`)) return false
  return true
}

function isBlogArticleIndexFile(filePath) {
  return filePath.endsWith(`${path.sep}blog${path.sep}${path.basename(path.dirname(filePath))}${path.sep}index.html`) &&
    filePath.includes(`${path.sep}blog${path.sep}`) &&
    filePath.endsWith(`${path.sep}index.html`) &&
    path.basename(path.dirname(filePath)) !== 'blog'
}

function validate({ repoRootDir }) {
  const errors = []
  const blogDir = path.join(repoRootDir, 'blog')
  const sitemapPath = path.join(repoRootDir, 'sitemap.xml')
  const robotsPath = path.join(repoRootDir, 'robots.txt')

  if (!fs.existsSync(blogDir)) errors.push(`Missing blog dir: ${blogDir}`)
  if (!fs.existsSync(sitemapPath)) errors.push(`Missing sitemap: ${sitemapPath}`)
  if (!fs.existsSync(robotsPath)) errors.push(`Missing robots: ${robotsPath}`)
  if (errors.length) return { errors }

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

  for (const filePath of articleIndexFiles) {
    const html = readUtf8(filePath)
    const canonical = extractCanonicalHref(html)
    if (!canonical) errors.push(`Article must include rel=canonical: ${path.relative(repoRootDir, filePath)}`)
    if (canonical && !canonical.endsWith('/')) errors.push(`Article canonical should end with trailing slash: ${path.relative(repoRootDir, filePath)}`)
    const robots = extractMetaRobots(html).toLowerCase().replace(/\s+/g, '')
    if (robots.includes('noindex')) errors.push(`Article must not be noindex: ${path.relative(repoRootDir, filePath)}`)
  }

  const { errors: linkErrors } = validateInternalLinks({ repoRootDir })
  errors.push(...linkErrors)

  return { errors }
}

function validateInternalLinks({ repoRootDir }) {
  const errors = []
  const blogIndexPath = path.join(repoRootDir, 'blog', 'index.html')
  if (!fs.existsSync(blogIndexPath)) return { errors: [`Missing blog index: ${blogIndexPath}`] }
  const html = readUtf8(blogIndexPath)
  const hrefs = Array.from(html.matchAll(/\shref=["']([^"']+)["']/g)).map((m) => String(m[1] || '').trim())
  const bad = hrefs.filter((h) => /\/blog\/[^/]+\.html$/i.test(h))
  if (bad.length) errors.push('blog/index.html contains links to .html stubs; links should point at /blog/{slug}/ canonical paths.')
  return { errors }
}

function main() {
  const repoRootDir = path.join(__dirname, '..')
  const { errors } = validate({ repoRootDir })
  if (!errors.length) {
    console.log('SEO validation OK')
    return
  }
  console.error('SEO validation failed:\n' + errors.map((e) => `- ${e}`).join('\n'))
  process.exit(1)
}

main()

