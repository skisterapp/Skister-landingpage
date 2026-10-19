'use strict'

const HOVER_LEGACY =
  /\.comment-form \.btn-submit:hover\s*\{\s*background:\s*var\(--primary-green-light\)\s*;\s*\}/g

const HOVER_APP =
  '.comment-form .btn-submit:hover { background:var(--primary-green-dark); }'

const FOCUS_RULE =
  '.comment-form .btn-submit:focus-visible { outline:2px solid var(--primary-green); outline-offset:2px; }'

const DISABLED_RULE =
  '.comment-form .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }'

function ensureRootPrimaryDark(styleInner) {
  if (!styleInner.includes('--primary-green')) return styleInner
  if (styleInner.includes('--primary-green-dark')) return styleInner
  return styleInner.replace(
    /(--primary-green:\s*#00af64\s*;)/i,
    (match) => `${match} --primary-green-dark:#008f54;`,
  )
}

function patchCommentButtonCssInStyle(styleInner) {
  if (!styleInner.includes('btn-submit')) return styleInner
  let next = ensureRootPrimaryDark(styleInner)
  next = next.replace(HOVER_LEGACY, HOVER_APP)
  next = next.replace(
    /(\.comment-form \.btn-submit\s*\{[^}]*?)color:\s*#fff\s*;/g,
    '$1color:#f4faf7;',
  )
  if (!next.includes('.comment-form .btn-submit:focus-visible')) {
    next = next.replace(
      /\.comment-form \.btn-submit:hover\s*\{[^}]+\}/,
      (hoverRule) => `${hoverRule} ${FOCUS_RULE} ${DISABLED_RULE}`,
    )
  }
  return next
}

function patchCommentButtonsInArticleHtml(html) {
  if (!html.includes('btn-submit')) return html
  return html.replace(/<style>([\s\S]*?)<\/style>/, (match, styleInner) => {
    const nextInner = patchCommentButtonCssInStyle(styleInner)
    if (nextInner === styleInner) return match
    return `<style>${nextInner}</style>`
  })
}

function articleHasCorrectCommentButtonCss(html) {
  if (!html.includes('btn-submit')) return true
  if (/btn-submit:hover[^}]*primary-green-light/i.test(html)) return false
  if (!/--primary-green-dark:\s*#008f54/i.test(html)) return false
  if (!/\.comment-form \.btn-submit:hover[^}]*primary-green-dark/i.test(html)) return false
  return true
}

module.exports = {
  patchCommentButtonCssInStyle,
  patchCommentButtonsInArticleHtml,
  articleHasCorrectCommentButtonCss,
}
