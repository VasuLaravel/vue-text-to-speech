/**
 * Post-build script: copies every *.d.ts → *.d.cts so that CJS consumers
 * get correct types when "require" condition is resolved.
 *
 * Run after `vue-tsc --declaration --emitDeclarationOnly`.
 */
import { readdirSync, copyFileSync, statSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const distDir = join(fileURLToPath(import.meta.url), '../../dist')

function copyDts(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      copyDts(full)
    } else if (entry.endsWith('.d.ts')) {
      copyFileSync(full, full.replace(/\.d\.ts$/, '.d.cts'))
    }
  }
}

copyDts(distDir)
console.log('✓ .d.cts files generated')
