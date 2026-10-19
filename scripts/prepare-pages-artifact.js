#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { loadLegalSiteConfig } = require('./legal-public-urls')

const ROOT = path.join(__dirname, '..')
const ARTIFACT_ROOT = path.join(ROOT, 'build', 'pages-artifact')
const MANIFEST_NAME = 'DEPLOY_MANIFEST.json'

const SKIP_DIR_NAMES = new Set(['.git', 'node_modules', 'build', '.cursor'])

function shouldSkipEntry(relativePath, name) {
  if (SKIP_DIR_NAMES.has(name)) return true
  if (relativePath === MANIFEST_NAME) return true
  if (relativePath === `build/${MANIFEST_NAME}`) return true
  return false
}

function copyTree(srcDir, destDir, options) {
  fs.mkdirSync(destDir, { recursive: true })
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const relativePath = path.relative(ROOT, srcPath).split(path.sep).join('/')
    if (shouldSkipEntry(relativePath, entry.name)) continue
    if (!options.impressumPublished && entry.name === 'impressum.html' && srcDir === ROOT) {
      options.excludedFiles.push(relativePath)
      continue
    }
    const destPath = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      copyTree(srcPath, destPath, options)
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath)
      options.includedFiles.push(relativePath)
    }
  }
}

function main() {
  const site = loadLegalSiteConfig()
  const options = {
    impressumPublished: Boolean(site.impressumPublished),
    excludedFiles: [],
    includedFiles: [],
  }

  if (options.impressumPublished) {
    const impressumPath = path.join(ROOT, 'impressum.html')
    if (!fs.existsSync(impressumPath)) {
      console.error('prepare-pages-artifact: impressumPublished is true but impressum.html is missing')
      process.exit(1)
    }
  }

  if (fs.existsSync(ARTIFACT_ROOT)) {
    fs.rmSync(ARTIFACT_ROOT, { recursive: true, force: true })
  }

  copyTree(ROOT, ARTIFACT_ROOT, options)

  const manifest = {
    generatedAt: new Date().toISOString(),
    impressumPublished: options.impressumPublished,
    excludedFromArtifact: options.excludedFiles,
    artifactRoot: 'build/pages-artifact',
  }
  fs.writeFileSync(path.join(ARTIFACT_ROOT, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log('prepare-pages-artifact: wrote', ARTIFACT_ROOT)
  console.log('prepare-pages-artifact: impressumPublished =', options.impressumPublished)
  if (options.excludedFiles.length) {
    console.log('prepare-pages-artifact: excluded:', options.excludedFiles.join(', '))
  }
}

main()
