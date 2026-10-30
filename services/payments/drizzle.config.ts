import { defineConfig } from 'drizzle-kit'

// Used by `pnpm db:generate` only. Migrations are applied by src/db/migrate.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
})
