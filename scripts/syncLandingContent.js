#!/usr/bin/env node
/**
 * Pull landing page CMS overrides from Supabase KV and write data/landing-content.json.
 * Used by GitHub Actions (every 12h) so static site + git reflect CMS edits.
 *
 * Usage: SUPABASE_ANON_KEY=... node scripts/syncLandingContent.js
 */
'use strict'

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SKISTER_SUPABASE_URL || 'https://ayomhapkzckbhgwxenwr.supabase.co'
const ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
const EDGE = `${SUPABASE_URL}/functions/v1/make-server-080ebf84`
const OUT_DIR = path.join(__dirname, '..', 'data')
const OUT_FILE = path.join(OUT_DIR, 'landing-content.json')

async function fetchLandingContent() {
  const res = await fetch(`${EDGE}/landing-content`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`landing-content ${res.status}: ${text}`)
  }
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'landing-content request failed')
  return data.content
}

function normalizePayload(content) {
  if (!content || typeof content !== 'object') {
    return { translations: {}, images: {} }
  }
  return {
    translations: content.translations && typeof content.translations === 'object' ? content.translations : {},
    images: content.images && typeof content.images === 'object' ? content.images : {},
  }
}

async function main() {
  if (!ANON_KEY) {
    console.error('Set SUPABASE_ANON_KEY (Skister anon JWT).')
    process.exit(1)
  }

  const content = await fetchLandingContent()
  const payload = {
    ...normalizePayload(content),
    syncedAt: new Date().toISOString(),
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })

  let previous = ''
  if (fs.existsSync(OUT_FILE)) {
    previous = fs.readFileSync(OUT_FILE, 'utf8')
  }

  const next = JSON.stringify(payload, null, 2) + '\n'
  const changed = previous !== next

  fs.writeFileSync(OUT_FILE, next, 'utf8')

  if (!content) {
    console.log('No CMS overrides in KV; wrote empty snapshot.')
  } else {
    const langs = Object.keys(payload.translations)
    console.log(`Synced landing content (${langs.length} language(s)).`)
  }

  if (process.env.GITHUB_OUTPUT) {
    const out = changed ? 'true' : 'false'
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${out}\n`)
  }

  if (!changed) {
    console.log('No changes since last sync.')
  }
}

main().catch(function (err) {
  console.error(err)
  process.exit(1)
})
