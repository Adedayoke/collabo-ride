// The local `collabo` oxlint JS plugin. Node runs these files directly (type stripping), so
// they use erasable syntax only: no enums, namespaces, or parameter properties.

import { noUntranslatedCall } from './no-untranslated-call.ts'

const plugin = {
  meta: { name: 'collabo' },
  rules: {
    'no-untranslated-call': noUntranslatedCall,
  },
}

// oxlint loads a plugin from its default export.
export default plugin
