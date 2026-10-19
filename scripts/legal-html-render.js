'use strict'

const SUPPORTED = ['de', 'en', 'fr', 'it']

function resolveLocale(lang) {
  if (!lang) return 'de'
  const normalized = String(lang).toLowerCase().slice(0, 2)
  if (SUPPORTED.includes(normalized)) return normalized
  return 'en'
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function linkifyText(text) {
  const escaped = escapeHtml(text)
  return escaped
    .replace(
      /(support@skister\.app|privacy@skister\.app)/gi,
      '<a href="mailto:$1" style="color: var(--primary-green); text-decoration: none;">$1</a>',
    )
    .replace(/WICHTIG:/g, '<strong>WICHTIG:</strong>')
    .replace(/IMPORTANT:/g, '<strong>IMPORTANT:</strong>')
    .replace(/IMPORTANTE:/g, '<strong>IMPORTANTE:</strong>')
    .replace(/IMPORTANT :/g, '<strong>IMPORTANT :</strong>')
}

function renderSection(section) {
  const variantClass =
    section.variant === 'warning'
      ? ' legal-section--warning'
      : section.variant === 'info'
        ? ' legal-section--info'
        : ''

  let html = `<section class="legal-section${variantClass}">`
  html += `<h3>${escapeHtml(section.title)}</h3>`

  if (section.paragraphs) {
    section.paragraphs.forEach(function (paragraph) {
      html += `<p>${linkifyText(paragraph)}</p>`
    })
  }

  if (section.bullets && section.bullets.length) {
    html += '<ul>'
    section.bullets.forEach(function (item) {
      html += `<li>${linkifyText(item)}</li>`
    })
    html += '</ul>'
  }

  html += '</section>'
  return html
}

function getDocument(content, type, lang) {
  if (!content) return null
  const locale = resolveLocale(lang)
  const bucket = type === 'privacy' ? content.privacy : content.terms
  if (!bucket) return null
  return bucket[locale] || bucket.en || bucket.de
}

function getUpdatedLine(content, type, lang) {
  const locale = resolveLocale(lang)
  const label = content.updatedLabels[locale] || content.updatedLabels.en || 'Last updated'
  const doc = getDocument(content, type, locale)
  if (!doc) return ''
  return `${label}: ${doc.updated}`
}

function renderDocumentHtml(content, type, lang) {
  const doc = getDocument(content, type, lang)
  if (!doc || !doc.sections) return ''
  return doc.sections.map(renderSection).join('\n')
}

module.exports = {
  SUPPORTED,
  resolveLocale,
  renderDocumentHtml,
  getUpdatedLine,
}
