import { createFileRoute, notFound } from '@tanstack/react-router'
import { lazy } from 'react'

// Development builds only. `import.meta.env.DEV` is false in production builds, so the
// catalog import is dropped from the bundle; CI checks the bundle for its marker string.
const UiCatalog = import.meta.env.DEV
  ? lazy(() => import('@collabo/ui/web/catalog').then((module) => ({ default: module.UiCatalog })))
  : () => null

export const Route = createFileRoute('/dev/ui')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: UiCatalog,
})
