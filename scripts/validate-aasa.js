#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const AASA_PATH = path.join(__dirname, '..', '.well-known', 'apple-app-site-association')
const EXPECTED_TEAM_BUNDLE = 'YX8N422BWQ.com.skister.app'
const ALLOWED_PATH_PREFIXES = ['/invite', '/invite/']

function fail(message) {
  console.error(`validate-aasa: ${message}`)
  process.exit(1)
}

const raw = fs.readFileSync(AASA_PATH, 'utf8')
let doc
try {
  doc = JSON.parse(raw)
} catch {
  fail('invalid JSON')
}

const details = doc?.applinks?.details
if (!Array.isArray(details) || details.length === 0) fail('applinks.details missing')

const appIds = details[0]?.appIDs
if (!Array.isArray(appIds) || !appIds.includes(EXPECTED_TEAM_BUNDLE)) {
  fail(`expected appIDs to include ${EXPECTED_TEAM_BUNDLE}`)
}

const paths = details[0]?.paths
if (!Array.isArray(paths) || paths.length === 0) fail('paths missing')

for (const p of paths) {
  if (typeof p !== 'string' || !p.startsWith('/')) fail(`invalid path entry: ${p}`)
  if (p === '*' || p === '/*') fail('over-broad wildcard path')
}

const hasInvite = paths.some((p) => p === '/invite' || p.startsWith('/invite'))
if (!hasInvite) fail('missing /invite path coverage')

if (JSON.stringify(doc).match(/eyJ[A-Za-z0-9_-]{10,}/)) fail('credential-like token in AASA')

console.log('validate-aasa: PASS')
