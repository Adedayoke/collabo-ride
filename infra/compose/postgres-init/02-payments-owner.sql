-- Safe to run more than once, as the superuser. Runs after 01 on a fresh
-- volume, and through `pnpm db:bootstrap` on an existing one (spec 0010.3,
-- Ownership).
--
-- payments_owner owns the payments schema and runs its migrations. The
-- payments service role reads and writes the tables it is granted, and cannot
-- edit or drop the ledger: a schema owner may drop any table inside it, so the
-- service role must not own the schema.

\set ON_ERROR_STOP on

\getenv payments_owner_pw PAYMENTS_OWNER_DB_PASSWORD

SELECT 'CREATE ROLE payments_owner LOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'payments_owner') \gexec

ALTER ROLE payments_owner PASSWORD :'payments_owner_pw';
ALTER ROLE payments_owner SET search_path = payments, public;
SELECT format('GRANT CONNECT ON DATABASE %I TO payments_owner', current_database()) \gexec
GRANT USAGE ON SCHEMA public TO payments_owner;

ALTER SCHEMA payments OWNER TO payments_owner;
GRANT USAGE ON SCHEMA payments TO payments;

-- Tables payments_owner creates are usable by the service role. Migrations
-- revoke more where a table needs it (the journal is read and append only).
ALTER DEFAULT PRIVILEGES FOR ROLE payments_owner IN SCHEMA payments
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO payments;
ALTER DEFAULT PRIVILEGES FOR ROLE payments_owner IN SCHEMA payments
  GRANT USAGE, SELECT ON SEQUENCES TO payments;
