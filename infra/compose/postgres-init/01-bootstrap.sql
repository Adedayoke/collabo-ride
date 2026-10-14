-- Runs once, as the superuser, when the Postgres data volume is first created
-- (spec 0009, Data and events). Creates PostGIS, then one schema and one login
-- role per service. Each role can reach only its own schema.
-- Passwords come from the container environment through psql \getenv.

\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS postgis;

-- Nobody but the owner creates objects in public.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

\getenv accounts_pw ACCOUNTS_DB_PASSWORD
\getenv trip_pw TRIP_DB_PASSWORD
\getenv dispatch_pw DISPATCH_DB_PASSWORD
\getenv payments_pw PAYMENTS_DB_PASSWORD
\getenv notifications_pw NOTIFICATIONS_DB_PASSWORD
\getenv fraud_pw FRAUD_DB_PASSWORD

CREATE ROLE accounts LOGIN PASSWORD :'accounts_pw';
CREATE ROLE trip LOGIN PASSWORD :'trip_pw';
CREATE ROLE dispatch LOGIN PASSWORD :'dispatch_pw';
CREATE ROLE payments LOGIN PASSWORD :'payments_pw';
CREATE ROLE notifications LOGIN PASSWORD :'notifications_pw';
CREATE ROLE fraud LOGIN PASSWORD :'fraud_pw';

DO $$
DECLARE
  svc text;
BEGIN
  FOREACH svc IN ARRAY ARRAY['accounts', 'trip', 'dispatch', 'payments', 'notifications', 'fraud'] LOOP
    -- The service role owns its schema: it can create and migrate inside it, nothing else.
    EXECUTE format('CREATE SCHEMA %I AUTHORIZATION %I', svc, svc);
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', svc);
    EXECUTE format('ALTER ROLE %I SET search_path = %I, public', svc, svc);
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), svc);
    -- Read only use of PostGIS types and functions that live in public.
    EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', svc);
  END LOOP;
END
$$;

-- No service may connect by default; each role is granted CONNECT above.
DO $$ BEGIN EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', current_database()); END $$;
