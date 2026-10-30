// `pnpm ui:tokens`: writes `dist/tokens.css` and the woff2 fonts the console loads.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { compress } from 'wawoff2'

import { renderTokensCss } from '../css.ts'
import { fontFamilies } from '../fonts.ts'

const root = join(import.meta.dirname, '..', '..')
const dist = join(root, 'dist')
mkdirSync(join(dist, 'fonts'), { recursive: true })

for (const faces of Object.values(fontFamilies)) {
  for (const face of Object.values(faces)) {
    const ttf = readFileSync(join(root, 'fonts', `${face.token}.ttf`))
    writeFileSync(join(dist, 'fonts', `${face.token}.woff2`), await compress(ttf))
  }
}

writeFileSync(join(dist, 'tokens.css'), renderTokensCss('./fonts'))
console.log('Wrote dist/tokens.css and dist/fonts/*.woff2')
