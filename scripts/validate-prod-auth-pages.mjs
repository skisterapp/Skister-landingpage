#!/usr/bin/env node
'use strict'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const required = [
  'verify-email/index.html',
  'login/index.html',
  'assets/skister-prod-auth-core.mjs',
  'assets/skister-prod-auth-shared.mjs',
  'assets/skister-prod-auth-verify.mjs',
  'assets/skister-prod-auth-login.mjs',
  'assets/skister-auth-pages.css',
]

function fail(msg) {
  console.error(`validate-prod-auth-pages: ${msg}`)
  process.exit(1)
}

for (const rel of required) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) fail(`missing ${rel}`)
}

for (const page of ['verify-email/index.html', 'login/index.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8')
  if (!html.includes('noindex')) fail(`${page} must be noindex`)
  if (html.includes('service_role')) fail(`${page} must not reference service role`)
  if (!html.includes('skister-prod-auth')) fail(`${page} must load prod auth module`)
}

console.log('validate-prod-auth-pages: OK')
