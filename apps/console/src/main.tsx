import '@collabo/ui/tokens.css'
import './index.css'

import { I18nextProvider } from '@collabo/i18n'
import { initColorMode } from '@collabo/ui/web'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { preloadFonts } from './fonts'
import { i18n } from './i18n'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

initColorMode()
preloadFonts(i18n.language)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element in index.html')

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  </StrictMode>,
)
