// The `(dev)` route group (the /dev/ui catalog) is only bundled when EXPO_PUBLIC_DEV_UI is
// true, so production bundles never carry it. CI checks the bundle for its marker string.
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

if (process.env.EXPO_PUBLIC_DEV_UI !== 'true') {
  const devRoutes = /[/\\]src[/\\]app[/\\]\(dev\)[/\\]/
  const existing = config.resolver.blockList
  config.resolver.blockList = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), devRoutes]
}

module.exports = config
