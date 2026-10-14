// Writes `tokens/fonts.ts` from the font files. Run after adding or replacing a font file.

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { analyzeFonts, renderFontsModule } from './font-coverage.ts'

const target = join(import.meta.dirname, '..', 'fonts.ts')
const analysis = analyzeFonts()
writeFileSync(target, renderFontsModule(analysis))
// The oxfmt bin is a Node script outside the package exports, so find it beside package.json
// and run it with this Node rather than through a shell.
const oxfmt = join(dirname(createRequire(import.meta.url).resolve('oxfmt/package.json')), 'bin', 'oxfmt')
execFileSync(process.execPath, [oxfmt, target], { stdio: 'inherit' })
console.log('Wrote tokens/fonts.ts:', analysis.localeFontSet)
