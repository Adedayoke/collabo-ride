import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node24',
  clean: true,
  // Workspace packages ship TypeScript source, so they are bundled in.
  noExternal: [/^@collabo\//],
})
