#!/usr/bin/env node
/**
 * Deployment validator — checks that all assets referenced in index.html
 * actually exist in the dist folder. Run this after `npm run build`.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const indexPath = path.join(distDir, 'index.html')

console.log('🔍 Validating build output...')

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in dist/')
  process.exit(1)
}

const html = fs.readFileSync(indexPath, 'utf-8')

// Extract all src and href attributes that point to /assets/
const assetRegex = /(?:src|href)="(\/assets\/[^"]+)"/g
const matches = [...html.matchAll(assetRegex)]
const assetPaths = matches.map(m => m[1])

if (assetPaths.length === 0) {
  console.error('❌ No asset references found in index.html')
  process.exit(1)
}

console.log(`📦 Found ${assetPaths.length} asset references`)

let missing = []
for (const assetPath of assetPaths) {
  const fullPath = path.join(distDir, assetPath.replace(/^\//, ''))
  if (!fs.existsSync(fullPath)) {
    missing.push(assetPath)
  }
}

if (missing.length > 0) {
  console.error('❌ Missing assets:')
  missing.forEach(p => console.error(`   - ${p}`))
  process.exit(1)
}

console.log('✅ All assets present')
console.log('✅ Build validation passed')
