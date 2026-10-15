// Metro resolves a PNG import to an image source, picking the `@2x` and `@3x` files by density.
declare module '*.png' {
  import type { ImageRequireSource } from 'react-native'

  const source: ImageRequireSource
  export default source
}
