import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkMigration, isMigration } from './migration-guard'

const rules = (path: string, text: string) => checkMigration(path, text).map((f) => f.rule)
const sql = (text: string) => rules('services/trip/drizzle/0009_probe.sql', text)

describe('migration guard rejects', () => {
  it.each([
    ['a dropped table', 'DROP TABLE trip.offers;', 'drop_table'],
    ['a dropped column', 'ALTER TABLE trip.offers DROP COLUMN eta_seconds;', 'drop_column'],
    ['a renamed table', 'ALTER TABLE trip.offers RENAME TO bids;', 'rename'],
    ['a renamed column', 'ALTER TABLE trip.offers RENAME COLUMN eta_seconds TO eta_s;', 'rename'],
    ['a changed type', 'ALTER TABLE trip.offers ALTER COLUMN price_kobo TYPE numeric;', 'change_type'],
    [
      'a changed type (long form)',
      'ALTER TABLE trip.offers ALTER COLUMN price_kobo SET DATA TYPE numeric;',
      'change_type',
    ],
    [
      'a NOT NULL column with no default',
      'ALTER TABLE trip.offers ADD COLUMN note text NOT NULL;',
      'not_null_without_default',
    ],
    [
      'a drop constraint without the marker',
      'ALTER TABLE trip.offers DROP CONSTRAINT offers_kind_check;',
      'drop_constraint',
    ],
    [
      'a quoted geography type',
      'ALTER TABLE trip.offers ADD COLUMN at_point "geography(Point,4326)";',
      'quoted_geography',
    ],
    ['a created schema', 'CREATE SCHEMA "accounts";', 'create_schema'],
  ])('%s', (_name, text, rule) => {
    expect(sql(text)).toContain(rule)
  })

  it('a NOT NULL column split across lines', () => {
    expect(sql('ALTER TABLE trip.offers\n  ADD COLUMN note text\n  NOT NULL;')).toEqual(['not_null_without_default'])
  })

  it('a widen-check that does not add the constraint back', () => {
    const text = `-- guard: widen-check
ALTER TABLE trip.offers DROP CONSTRAINT offers_kind_check;
ALTER TABLE trip.offers ADD CONSTRAINT offers_kind_check_v2 CHECK (kind IN ('accept', 'counter', 'bid'));`
    expect(sql(text)).toEqual(['widen_check_not_readded'])
  })

  it('Alembic drops and type changes', () => {
    const py = `def upgrade() -> None:
    op.drop_column("match_scores", "score")
    op.alter_column("match_scores", "score", type_=sa.Numeric())
`
    expect(rules('services/fraud/alembic/versions/0009_probe.py', py)).toEqual(['drop_column', 'change_type'])
  })
})

describe('migration guard allows', () => {
  it('new tables, nullable columns, columns with a default, and indexes', () => {
    const text = `CREATE TABLE trip.ratings (id uuid PRIMARY KEY DEFAULT uuidv7(), score smallint NOT NULL);
ALTER TABLE trip.offers ADD COLUMN note text;
ALTER TABLE trip.offers ADD COLUMN is_boosted boolean NOT NULL DEFAULT false;
CREATE INDEX offers_driver_idx ON trip.offers (driver_id);`
    expect(sql(text)).toEqual([])
  })

  it('widening a CHECK under the marker, re-added with the same name', () => {
    const text = `-- guard: widen-check
ALTER TABLE trip.offers DROP CONSTRAINT offers_kind_check;
ALTER TABLE trip.offers ADD CONSTRAINT offers_kind_check CHECK (kind IN ('accept', 'counter', 'bid'));`
    expect(sql(text)).toEqual([])
  })

  it('drops in a goose Down section and an Alembic downgrade', () => {
    expect(
      rules(
        'services/dispatch/migrations/00009_probe.sql',
        '-- +goose Up\nCREATE TABLE t (id uuid);\n-- +goose Down\nDROP TABLE t;\n',
      ),
    ).toEqual([])
    expect(
      rules(
        'services/fraud/alembic/versions/0009_probe.py',
        'def upgrade() -> None:\n    pass\n\n\ndef downgrade() -> None:\n    op.drop_table("t")\n',
      ),
    ).toEqual([])
  })

  it('words like drop and rename inside comments', () => {
    expect(sql('-- we never DROP TABLE or RENAME COLUMN here\nCREATE TABLE trip.t (id uuid);')).toEqual([])
  })

  it('every migration already in the repo', () => {
    const root = new URL('../../../', import.meta.url)
    const files = [
      ...['accounts', 'trip', 'payments', 'notifications'].flatMap((s) =>
        readdirSync(new URL(`services/${s}/drizzle/`, root))
          .filter((f) => f.endsWith('.sql'))
          .map((f) => `services/${s}/drizzle/${f}`),
      ),
      ...readdirSync(new URL('services/dispatch/migrations/', root))
        .filter((f) => f.endsWith('.sql'))
        .map((f) => `services/dispatch/migrations/${f}`),
      ...readdirSync(new URL('services/fraud/alembic/versions/', root))
        .filter((f) => f.endsWith('.py'))
        .map((f) => `services/fraud/alembic/versions/${f}`),
    ]
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      expect(isMigration(file)).toBe(true)
      expect(checkMigration(file, readFileSync(new URL(file, root), 'utf8'))).toEqual([])
    }
  })
})
