#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { getImpressumFooterLinkHtml, loadLegalSiteConfig } = require('./legal-public-urls')

const ROOT = path.join(__dirname, '..')
const cfg = loadLegalSiteConfig()
const impressumLink = getImpressumFooterLinkHtml('/')
const impressumRelArticle = getImpressumFooterLinkHtml('../../')

const ARTICLE_FOOTER_OLD = '<footer class="article-footer"><p>Developed by SEMPROG</p></footer>'
const articleLegalParts = [
  '<a href="../../privacy.html">Datenschutz</a>',
  '<a href="../../terms.html">Nutzungsbedingungen</a>',
]
if (cfg.impressumPublished && impressumRelArticle) articleLegalParts.push(impressumRelArticle)
const ARTICLE_FOOTER_NEW =
  `<footer class="article-footer"><p class="article-legal-links">${articleLegalParts.join(' · ')}</p><p>Developed by SEMPROG</p></footer>`

let articleCount = 0
const blogRoot = path.join(ROOT, 'blog')
for (const entry of fs.readdirSync(blogRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const indexPath = path.join(blogRoot, entry.name, 'index.html')
  if (!fs.existsSync(indexPath)) continue
  let html = fs.readFileSync(indexPath, 'utf8')
  if (html.includes(ARTICLE_FOOTER_OLD)) {
    html = html.replace(ARTICLE_FOOTER_OLD, ARTICLE_FOOTER_NEW)
    fs.writeFileSync(indexPath, html, 'utf8')
    articleCount++
  }
}

const blogIndexPath = path.join(blogRoot, 'index.html')
let blogIndexPatched = false
if (fs.existsSync(blogIndexPath)) {
  let html = fs.readFileSync(blogIndexPath, 'utf8')
  const impressumBlog = getImpressumFooterLinkHtml('../')
  const needle = '<a href="../terms.html">Terms</a>'
  if (cfg.impressumPublished && impressumBlog && html.includes(needle) && !html.includes('impressum.html')) {
    html = html.replace(needle, `${needle}\n        ${impressumBlog}`)
    fs.writeFileSync(blogIndexPath, html, 'utf8')
    blogIndexPatched = true
  }
}

console.log(`patch-static-legal-footers: articles=${articleCount} blogIndex=${blogIndexPatched}`)
