// Preloads the regular and semibold faces of the active locale's font set, the two weights
// most pages paint first. The URLs are the same hashed files `tokens.css` points at.

import { fontFamilies, fontSetForLocale } from '@collabo/ui/tokens'

const fontUrls = import.meta.glob<string>('../../../packages/ui/dist/fonts/*.woff2', {
  query: '?url',
  import: 'default',
  eager: true,
})

export function preloadFonts(locale: string): void {
  const faces = fontFamilies[fontSetForLocale(locale)]
  for (const face of [faces[400], faces[600]]) {
    const href = fontUrls[`../../../packages/ui/dist/fonts/${face.token}.woff2`]
    if (!href) continue
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.append(link)
  }
}
