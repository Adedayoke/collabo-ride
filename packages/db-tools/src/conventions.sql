-- Convention check over every service schema (spec 0010, AC-1). Returns one
-- row per violation; no rows means the schemas follow the conventions.
--   $1 text[]  the service schemas
--   $2 text[]  tables keyed by something other than `id` (listed exceptions)
WITH tables AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name, c.oid
  FROM pg_class AS c
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = ANY ($1)
    AND c.relkind IN ('r', 'p')
    AND NOT c.relispartition
    -- Bookkeeping tables of the three migration tools.
    AND c.relname NOT IN ('__drizzle_migrations', 'goose_db_version', 'alembic_version')
),
cols AS (
  SELECT t.schema_name, t.table_name, t.oid, a.attnum, a.attname AS column_name,
         format_type(a.atttypid, a.atttypmod) AS column_type,
         pg_get_expr(d.adbin, d.adrelid) AS default_expr
  FROM tables AS t
  JOIN pg_attribute AS a ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef AS d ON d.adrelid = t.oid AND d.adnum = a.attnum
)
SELECT t.schema_name, t.table_name, NULL::text AS column_name, 'primary_key' AS rule,
       'needs id uuid PRIMARY KEY DEFAULT uuidv7(), or a listed exception' AS detail
FROM tables AS t
WHERE t.table_name <> ALL ($2)
  AND NOT EXISTS (
    SELECT 1
    FROM cols AS c
    JOIN pg_index AS i ON i.indrelid = c.oid AND i.indisprimary AND i.indnatts = 1 AND i.indkey[0] = c.attnum
    WHERE c.oid = t.oid AND c.column_name = 'id' AND c.column_type = 'uuid' AND c.default_expr = 'uuidv7()'
  )

UNION ALL
SELECT schema_name, table_name, column_name, 'timestamptz', column_type || ' has no time zone; use timestamptz'
FROM cols
WHERE column_type IN ('timestamp without time zone', 'time without time zone')

UNION ALL
SELECT schema_name, table_name, column_name, 'money_bigint', 'a _kobo column must be bigint, not ' || column_type
FROM cols
WHERE column_name LIKE '%\_kobo' AND column_type <> 'bigint'

UNION ALL
SELECT schema_name, table_name, column_name, 'money_kobo', column_type || ' is not allowed; store money as bigint _kobo'
FROM cols
WHERE column_type ~ '^(numeric|money)'

UNION ALL
SELECT schema_name, table_name, column_name, 'point',
       'points are geography(Point,4326), not ' || column_type
FROM cols
WHERE (column_type ~ '^(geography|geometry)' OR column_name ~ '(^|_)points?$')
  AND column_type NOT IN ('geography(Point,4326)', 'geography(Point,4326)[]')

UNION ALL
SELECT schema_name, table_name, NULL, 'snake_case', 'table name is not snake_case'
FROM tables
WHERE table_name !~ '^[a-z][a-z0-9_]*$'

UNION ALL
SELECT schema_name, table_name, column_name, 'snake_case', 'column name is not snake_case'
FROM cols
WHERE column_name !~ '^[a-z][a-z0-9_]*$'

UNION ALL
SELECT n.nspname, t.typname, NULL, 'no_enum', 'native enum types are not allowed; use text with a CHECK'
FROM pg_type AS t
JOIN pg_namespace AS n ON n.oid = t.typnamespace
WHERE t.typtype = 'e' AND n.nspname = ANY ($1)

ORDER BY 1, 2, 3, 4
