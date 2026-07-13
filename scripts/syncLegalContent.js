#!/usr/bin/env node
/**
 * Sync website legal copy from Skisterapp/src/app/lib/legal-documents.ts
 * Run from Skister-main: npm run sync:legal
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const root = path.resolve(__dirname, '..')
const appRoot = path.resolve(root, '..', 'Skisterapp')
const jsonPath = path.join(__dirname, 'legal-content.json')
const jsPath = path.join(__dirname, 'legal-content.js')

const tempFile = path.join(os.tmpdir(), `skister-legal-export-${process.pid}.mjs`)

const exportScript = `import { getLegalDocument, getLegalUpdatedLabel } from '${path.join(appRoot, 'src/app/lib/legal-documents.ts').replace(/\\/g, '/')}'
const locales = ['de','en','fr','it']
const out = { updatedLabels: {}, terms: {}, privacy: {} }
for (const locale of locales) {
  out.updatedLabels[locale] = getLegalUpdatedLabel(locale)
  out.terms[locale] = getLegalDocument('terms', locale)
  out.privacy[locale] = getLegalDocument('privacy', locale)
}
console.log(JSON.stringify(out))
`

try {
  fs.writeFileSync(tempFile, exportScript, 'utf8')
  const json = execSync(`npx --yes tsx ${JSON.stringify(tempFile)}`, {
    cwd: appRoot,
    encoding: 'utf8',
  })
  fs.writeFileSync(jsonPath, json.trim() + '\n', 'utf8')
  fs.writeFileSync(jsPath, `window.SkisterLegalContent = ${json.trim()};\n`, 'utf8')
  console.log('Synced legal content to scripts/legal-content.js')
} catch (error) {
  console.error(error.stderr || error.message)
  process.exit(1)
} finally {
  try {
    fs.unlinkSync(tempFile)
  } catch (_) {}
}
