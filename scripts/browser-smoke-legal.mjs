#!/usr/bin/env node
/**
 * Browser smoke against build/pages-artifact (system Chrome via Playwright).
 * Usage: node scripts/browser-smoke-legal.mjs [--base=http://127.0.0.1:3460]
 */
'use strict'

import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARTIFACT = path.join(ROOT, 'build', 'pages-artifact')
const WIDTHS = [320, 390, 768, 1366]

const baseArg = process.argv.find((a) => a.startsWith('--base='))
const base = (baseArg ? baseArg.split('=')[1] : 'http://127.0.0.1:3460').replace(/\/$/, '')

const LEGAL_PATHS = [
  { path: '/impressum', expect: 'impressum.html' },
  { path: '/privacy', expect: 'privacy.html' },
  { path: '/terms', expect: 'terms.html' },
  { path: '/help', expect: 'help.html' },
  { path: '/impressum.html', expect: 'impressum.html' },
  { path: '/privacy.html', expect: 'privacy.html' },
  { path: '/terms.html', expect: 'terms.html' },
  { path: '/help.html', expect: 'help.html' },
]

function launchBrowser(playwright) {
  return playwright.chromium.launch({ channel: 'chrome', headless: true })
}

async function startStaticServer() {
  const proc = spawn('python3', ['-m', 'http.server', '3460', '--directory', ARTIFACT], {
    cwd: ROOT,
    stdio: 'ignore',
  })
  await sleep(1200)
  return proc
}

async function runSuite() {
  const { chromium } = await import('playwright')
  const browser = await launchBrowser({ chromium })
  const context = await browser.newContext()
  const page = await context.newPage()
  const results = []

  function record(id, status, detail) {
    results.push({ id, status, detail })
  }

  async function pickLanguage(lang) {
    await page.locator('#language-btn').click()
    await page.evaluate(() => {
      const dropdown = document.getElementById('language-dropdown')
      if (dropdown) dropdown.classList.add('active')
      const btn = document.getElementById('language-btn')
      if (btn) btn.setAttribute('aria-expanded', 'true')
    })
    await page.locator(`.language-option-btn[data-lang="${lang}"]`).click({ force: true })
    await sleep(250)
  }

  for (const { path: p, expect } of LEGAL_PATHS) {
    const id = `legal-url:${p}`
    try {
      await page.goto(`${base}${p}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await sleep(400)
      const url = page.url()
      const is404 = (await page.title()).includes('nicht gefunden') || (await page.locator('h1').textContent())?.includes('404')
      if (is404) {
        record(id, 'FAIL', `404 at ${url}`)
        continue
      }
      if (!url.includes(expect)) {
        record(id, 'FAIL', `landed ${url}, expected *${expect}*`)
        continue
      }
      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href')
      const canonicalCount = await page.locator('link[rel="canonical"]').count()
      if (canonicalCount !== 1) {
        record(id, 'FAIL', `${canonicalCount} canonical links (expected 1)`)
        continue
      }
      if (!canonical || !canonical.includes(`skister.app/${expect}`)) {
        record(id, 'FAIL', `canonical="${canonical}" expected skister.app/${expect}`)
        continue
      }
      record(id, 'PASS', `url=${url} canonical=${canonical}`)
    } catch (err) {
      record(id, 'FAIL', err.message)
    }
  }

  for (const w of WIDTHS) {
    const id = `terms-overflow:${w}`
    await page.setViewportSize({ width: w, height: 900 })
    await page.goto(`${base}/terms.html`, { waitUntil: 'domcontentloaded' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    record(id, overflow ? 'FAIL' : 'PASS', overflow ? 'horizontal overflow' : 'no overflow')
  }

  await page.setViewportSize({ width: 390, height: 844 })
  for (const file of ['privacy.html', 'terms.html', 'help.html']) {
    const id = `mobile-nav:${file}`
    await page.goto(`${base}/${file}`, { waitUntil: 'domcontentloaded' })
    const toggle = page.locator('#nav-menu-toggle')
    if (!(await toggle.isVisible())) {
      record(id, 'FAIL', 'nav toggle not visible')
      continue
    }
    await toggle.click()
    if (!(await page.locator('#primary-nav-links.is-open').isVisible())) {
      record(id, 'FAIL', 'nav did not open')
      continue
    }
    await page.evaluate(() => {
      if (window.SkisterLegalPageShell) SkisterLegalPageShell.setMobileNavOpen(false)
    })
    const langBtn = page.locator('.language-btn')
    if (!(await langBtn.isVisible())) {
      record(id, 'FAIL', 'language btn hidden')
      continue
    }
    await pickLanguage('en')
    const title = await page.title()
    record(id, 'PASS', `lang→en title="${title}"`)
  }

  const idEs = 'privacy-es-fallback'
  await page.goto(`${base}/privacy.html`, { waitUntil: 'domcontentloaded' })
  await pickLanguage('es')
  const fallbackVisible = await page.locator('#legal-es-fallback:not([hidden])').isVisible()
  const esTitle = await page.title()
  record(
    idEs,
    fallbackVisible && esTitle.toLowerCase().includes('privacidad') ? 'PASS' : 'FAIL',
    `fallback=${fallbackVisible} title=${esTitle}`,
  )

  const idPersist = 'lang-persistence'
  await page.evaluate(() => localStorage.setItem('skister-lang', 'fr'))
  await page.goto(`${base}/terms.html`, { waitUntil: 'domcontentloaded' })
  await sleep(300)
  const frLabel = await page.locator('#current-language').textContent()
  record(idPersist, frLabel?.includes('FR') ? 'PASS' : 'FAIL', `label=${frLabel}`)

  const idTermsModal = 'terms-contact-feedback'
  await page.goto(`${base}/terms.html`, { waitUntil: 'domcontentloaded' })
  await page.locator('footer button.footer-text-btn').first().click()
  await sleep(150)
  const modalActive = await page.locator('#modal-feedback.active').isVisible()
  record(idTermsModal, modalActive ? 'PASS' : 'FAIL', modalActive ? 'feedback modal opens' : 'feedback modal missing')

  const idHomeLang = 'homepage-lang-keyboard'
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  await page.locator('#language-btn').click()
  await page.locator('#language-dropdown.active').waitFor({ state: 'visible', timeout: 5000 })
  const esOption = page.locator('.language-option').filter({ hasText: 'Español' })
  await esOption.focus()
  await page.keyboard.press('Enter')
  await sleep(200)
  const esFlag = await page.locator('#current-language').textContent()
  record(idHomeLang, esFlag?.includes('ES') ? 'PASS' : 'FAIL', `current=${esFlag}`)

  const idMascot = 'homepage-brand-assets'
  const mascotSrc = await page.locator('.hero-mascot').getAttribute('src')
  const semprogHref = await page.locator('footer a[href="https://semprog.de/"]').count()
  const impressumHref = await page.locator('footer a[href="/impressum.html"]').count()
  const submitClass = await page.locator('#submit-btn').getAttribute('class')
  const ok =
    mascotSrc &&
    !mascotSrc.includes('SkisterAppPro227') &&
    semprogHref > 0 &&
    impressumHref > 0 &&
    submitClass?.includes('skister-btn-primary')
  record(
    idMascot,
    ok ? 'PASS' : 'FAIL',
    `mascot=${mascotSrc} semprog=${semprogHref} impressum=${impressumHref} btn=${submitClass}`,
  )

  const waitlistCases = [
    { name: 'success', body: { success: true }, expect: 'lista de espera' },
    { name: 'duplicate', body: { duplicate: true }, expect: 'ya está' },
    { name: 'error', body: { success: false }, expect: 'No se pudo' },
  ]
  for (const wc of waitlistCases) {
    const id = `waitlist-es-${wc.name}`
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => localStorage.setItem('skister-lang', 'es'))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.route('**/waitlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(wc.body),
      })
    })
    await page.locator('#email-input').fill('qa-mock+es@example.invalid')
    await page.locator('#submit-btn').click()
    await sleep(500)
    const msg = (await page.locator('#message-container').textContent()) || ''
    await page.unroute('**/waitlist')
    record(id, msg.toLowerCase().includes(wc.expect.toLowerCase()) ? 'PASS' : 'FAIL', msg.slice(0, 120))
  }

  const idSending = 'waitlist-es-sending'
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => localStorage.setItem('skister-lang', 'es'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  let hung = false
  await page.route('**/waitlist', async (route) => {
    hung = true
    await sleep(3000)
    await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
  })
  await page.locator('#email-input').fill('qa-mock+sending@example.invalid')
  await page.locator('#submit-btn').click()
  await sleep(100)
  const sendingText = await page.locator('#submit-btn').textContent()
  await page.unroute('**/waitlist')
  record(idSending, sendingText?.includes('Enviando') ? 'PASS' : 'FAIL', sendingText || '')

  await browser.close()
  return results
}

let server
async function main() {
  if (!baseArg) {
    server = await startStaticServer()
  }
  try {
    const results = await runSuite()
    const fails = results.filter((r) => r.status === 'FAIL')
    console.log('browser-smoke-legal results:')
    for (const r of results) {
      console.log(`  [${r.status}] ${r.id} — ${r.detail}`)
    }
    if (fails.length) {
      console.error(`browser-smoke-legal: FAIL (${fails.length}/${results.length})`)
      process.exit(1)
    }
    console.log(`browser-smoke-legal: PASS (${results.length} checks)`)
  } finally {
    if (server) server.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error('browser-smoke-legal: NOT RUN —', err.message)
  process.exit(2)
})
